from datetime import date

from django.db import models
from django.db.models import Q
from django.urls import reverse
from django.utils import timezone
from mezzanine.core.fields import FileField, RichTextField
from mezzanine.core.models import Displayable
from mezzanine.utils.models import AdminThumbMixin, upload_to
from taggit.managers import TaggableManager

from cdhweb.people.models import Person
from cdhweb.resources.models import (Attachment, DateRange, ExcerptMixin,
                                     PublishedQuerySetMixin, ResourceType)


class ProjectQuerySet(PublishedQuerySetMixin):

    def highlighted(self):
        '''return projects that are marked as highlighted'''
        return self.filter(highlight=True)

    def _current_grant_query(self):
        '''QuerySet filter to find projects with a current grant,
        based on start date before current date and end date after current
        date or not set.
        '''
        today = timezone.now()
        return (models.Q(grant__start_date__lt=today) &
                (models.Q(grant__end_date__gt=today) |
                 models.Q(grant__end_date__isnull=True)))

    def current(self):
        '''Projects with a current grant, based on dates'''
        return self.filter(self._current_grant_query()).distinct()

    def not_current(self):
        '''Projects with no current grant, based on dates'''
        return self.exclude(self._current_grant_query())

    #: grant types that indicate staff or postdoc project
    staff_postdoc_grants = ['Staff R&D', 'Postdoctoral Research Project']

    def staff_or_postdoc(self):
        '''Staff and postdoc projects, based on grant type'''
        return self.filter(grant__grant_type__grant_type__in=self.staff_postdoc_grants)

    def not_staff_or_postdoc(self):
        '''Exclude staff and postdoc projects, based on grant type'''
        return self.exclude(grant__grant_type__grant_type__in=self.staff_postdoc_grants)

    def order_by_newest_grant(self):
        '''order by grant start date, most recent grants first; secondary
        sort by project title'''
        # NOTE: using annotation to get just the most recent start date
        # to avoid issues with projects appearing multiple times.
        return self.annotate(last_start=models.Max('grant__start_date')) \
                   .order_by('-last_start', 'title')


class Project(Displayable, AdminThumbMixin, ExcerptMixin):
    '''A CDH sponsored project'''

    short_description = models.CharField(max_length=255, blank=True,
                                         help_text='Brief tagline for display on project card in browse view')
    long_description = RichTextField()
    highlight = models.BooleanField(default=False,
                                    help_text='Include in randomized project display on the home page.')
    cdh_built = models.BooleanField('CDH Built', default=False,
                                    help_text='Project built by CDH Development & Design team.')

    members = models.ManyToManyField(Person, through='Membership')
    resources = models.ManyToManyField(ResourceType, through='ProjectResource')

    tags = TaggableManager(blank=True)

    # TODO: include help text to indicate images are optional, where they
    # are used (size?); add language about putting large images in the
    # body of the project description, when we have styles for that.
    image = FileField(verbose_name="Image",
                      upload_to=upload_to("projects.image", "projects"),
                      format="Image", max_length=255, null=True, blank=True)

    thumb = FileField(verbose_name="Thumbnail",
                      upload_to=upload_to(
                          "projects.image", "projects/thumbnails"),
                      format="Image", max_length=255, null=True, blank=True)

    attachments = models.ManyToManyField(Attachment, blank=True)

    # custom manager and queryset
    objects = ProjectQuerySet.as_manager()

    admin_thumb_field = "thumb"

    class Meta:
        # sort by project title for now
        ordering = ['title']

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('project:detail', kwargs={'slug': self.slug})

    @property
    def website_url(self):
        '''website url, if set'''
        website = self.projectresource_set \
            .filter(resource_type__name='Website').first()
        if website:
            return website.url

    def latest_grant(self):
        '''Most recent :class:`Grant`'''
        if self.grant_set.count():
            return self.grant_set.order_by('-start_date').first()

    def current_memberships(self):
        ''':class:`MembershipQueryset` of current members sorted by role'''
        # uses memberships rather than members so that we can retain role
        # information attached to the membership
        return self.membership_set.filter(
            Q(grant=self.latest_grant()) | Q(status_override='current')) \
            .exclude(status_override='past') \


    def alums(self):
        ''':class:`PersonQueryset` of past members sorted by last name'''
        # uses people rather than memberships so that we can use distinct()
        # to ensure people aren't counted multiple times for each grant
        # and because we don't care about role (always 'alum')
        return self.members \
            .distinct() \
            .exclude(Q(membership__grant=self.latest_grant()) & ~Q(membership__status_override='past')) \
            .exclude(membership__status_override='current') \
            .order_by('last_name')


class GrantType(models.Model):
    '''Model to track kinds of grants'''
    grant_type = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.grant_type


class Grant(DateRange):
    '''A specific grant associated with a project'''
    project = models.ForeignKey(Project)
    grant_type = models.ForeignKey(GrantType)

    class Meta:
        ordering = ['start_date', 'project']

    def __str__(self):
        return '%s: %s (%s)' % (self.project.title, self.grant_type.grant_type,
                                self.years)


# fixme: where does resource type go, for associated links?

class Role(models.Model):
    '''A role on a project'''
    title = models.CharField(max_length=255, unique=True)
    sort_order = models.PositiveIntegerField(default=0, blank=False,
                                             null=False)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return self.title


class Membership(models.Model):
    '''Project membership - joins project, grant, user, and role.'''
    project = models.ForeignKey(Project)
    user = models.ForeignKey(Person)
    grant = models.ForeignKey(Grant)
    role = models.ForeignKey(Role)

    # allows forcing certain memberships to show as current or alum
    STATUS_OVERRIDE_CHOICES = (
        ('current', 'Current'),
        ('past', 'Alum'),
    )

    status_override = models.CharField(
        'Status Override', choices=STATUS_OVERRIDE_CHOICES, default='',
        help_text='Show the member as current or as an alum regardless of \
            associated project grant dates. Only use when displaying current \
                or past project members based on grant dates is incorrect.',
        blank=True, max_length=7)

    class Meta:
        ordering = ('role__sort_order', 'user__last_name')

    def __str__(self):
        return '%s - %s on %s' % (self.user, self.role, self.grant)


class ProjectResource(models.Model):
    '''Through-model for associating projects with resource types and
    URLs'''
    resource_type = models.ForeignKey(ResourceType, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    url = models.URLField()

    def display_url(self):
        '''url cleaned up for display, with leading http(s):// removed'''
        if self.url.startswith('https://'):
            return self.url[8:]
        elif self.url.startswith('http://'):
            return self.url[7:]
