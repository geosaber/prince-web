$(document).ready(function () {
    var $ribbon = $('.ribbon');
    if ($ribbon) {
        var faded = sessionStorage.getItem('fade-test-banner', true);
        if (!faded) {
            $('.ribbon-box').removeClass('fade');
        }
        $ribbon.on('click', function () {
            $('.ribbon-box').addClass('fade');
            sessionStorage.setItem('fade-test-banner', true);
        });
    }

    var scroll = 0;
    /*
      Check every time the window scrolls. If it's by 25px or more and
      the scroll is below 90px, hide the navi. If the scroll down isn't
      those, leave it as is.
      If the scroll is up by 5 px, bring the menu back.
    */
    $(window).scroll(function () {
        scrolled = $(document).scrollTop();
        if (scrolled - scroll > 25 && scrolled > scroll && scrolled >
            90) {
            $('header').addClass('hidden');
            hideCards()
        }
        else if (scrolled > scroll) {
            // Do nothing since the scroll was either
            // too high or not 'enough'
        }
        else if (scrolled < scroll && scroll - scrolled > 5) {
            $('header').removeClass('hidden');
        }

        scroll = scrolled;

    });


    $('.menu-toggle').on('click', function (e) {
        e.preventDefault();
        // toggle footer to act as main mobile nav
        $('footer').toggleClass('mobile-nav');
        $('body').toggleClass('fixed');
        // swap hamburger icon with close icon
        $(e.target).toggleClass('fa-bars').toggleClass('fa-times')
    });
    $('a.toggle').on('click', function (e) {
        $(this).parent().toggleClass('open');
        $(this).parent().find('.submenu').toggle();
    });


    /*
     * Main navigation
     */

    // keybindings for primary nav (people, projects, research, etc.)
    $('.primary-nav > li > a')
        .keydown(function (e) {
            switch (e.key) {
                case 'Home': {
                    e.preventDefault()
                    var firstLink = $('.primary-nav > li > a').first()
                    firstLink.focus()
                    break
                }
                case 'End': {
                    e.preventDefault()
                    var lastLink = $('.primary-nav > li > a').last()
                    lastLink.focus()
                    break
                }
                case 'ArrowLeft': {
                    e.preventDefault()
                    var prevLink = $(e.target).parent().prev('li').find('a')
                    prevLink.focus()
                    break
                }
                case 'ArrowUp': {
                    e.preventDefault()
                    showCard(e.target.id)
                    var lastCardLink = $('#' + e.target.id + '-secondary > li > a').last()
                    lastCardLink.focus()
                    break
                }
                case 'ArrowRight': {
                    e.preventDefault()
                    var nextLink = $(e.target).parent().next('li').find('a')
                    nextLink.focus()
                    break
                }
                case 'ArrowDown': {
                    e.preventDefault()
                    showCard(e.target.id)
                    var firstCardLink = $('#' + e.target.id + '-secondary > li > a').first()
                    firstCardLink.focus()
                    break
                }
                case 'Enter':
                case ' ': { // spacebar
                    e.preventDefault()
                    e.target.click()
                    break
                }
            }
        })

    // keybindings for secondary nav (flyout cards)
    $('.secondary-nav > li > a')
        .keydown(function (e) {
            switch (e.key) {
                case 'ArrowUp':
                case 'Escape': {
                    e.preventDefault()
                    var parentMenu = $(e.target).parents('.secondary-nav').get()[0]
                    var parentMenuName = parentMenu.id.split('-secondary')[0]
                    hideCards()
                    $('#' + parentMenuName).focus()
                    break
                }
                case 'Home': {
                    e.preventDefault()
                    var parentMenu = $(e.target).parents('.secondary-nav').first()
                    var firstLink = parentMenu.find('li').first().find('a')
                    firstLink.focus()
                    break
                }
                case 'End': {
                    e.preventDefault()
                    var parentMenu = $(e.target).parents('.secondary-nav').first()
                    var lastLink = parentMenu.find('li').last().find('a')
                    lastLink.focus()
                    break
                }
                case 'ArrowLeft': {
                    e.preventDefault()
                    var prevLink = $(e.target).parent().prev('li').find('a').first()
                    prevLink.focus()
                    break
                }
                case 'ArrowRight': {
                    e.preventDefault()
                    var nextLink = $(e.target).parent().next('li').find('a').first()
                    nextLink.focus()
                    break
                }
                case 'ArrowDown': {
                    e.preventDefault()
                    var associatedList = $(e.target).siblings('.tertiary-nav')
                    if (associatedList.length > 0) {
                        associatedList.find('a').first().focus()
                    }
                    break
                }
                case 'Enter':
                case ' ': { // spacebar
                    e.preventDefault()
                    e.target.click()
                    break
                }
            }
        })

    // keybindings for tertiary nav (lists on cards)
    $('.tertiary-nav > li > a')
        .keydown(function (e) {
            switch (e.key) {
                case 'Escape': {
                    e.preventDefault()
                    var parentCard = $(e.target).parents('.secondary-nav').get()[0]
                    var parentCardName = parentCard.id.split('-secondary')[0]
                    hideCards()
                    $('#' + parentCardName).focus()
                    break
                }
                case 'Home': {
                    e.preventDefault()
                    var parentMenu = $(e.target).parents('.tertiary-nav').first()
                    var firstLink = parentMenu.find('li').first().find('a')
                    firstLink.focus()
                    break
                }
                case 'End': {
                    e.preventDefault()
                    var parentMenu = $(e.target).parents('.tertiary-nav').first()
                    var lastLink = parentMenu.find('li').last().find('a')
                    lastLink.focus()
                    break
                }
                case 'ArrowLeft': {
                    e.preventDefault()
                    var parentSecondary = $(e.target).parents('.tertiary-nav').siblings('a')
                    var prevSecondary = parentSecondary.parent().prev('li').find('a').first()
                    prevSecondary.focus()
                    break
                }
                case 'ArrowUp': {
                    e.preventDefault()
                    var prevLink = $(e.target).parent().prev('li').find('a')
                    if (prevLink.length > 0) {
                        prevLink.focus()
                    }
                    else {
                        var parentMenu = $(e.target).parents('.tertiary-nav')
                        var parentSecondary = parentMenu.siblings('a')
                        parentSecondary.focus()
                    }
                    break
                }
                case 'ArrowRight': {
                    e.preventDefault()
                    var parentSecondary = $(e.target).parents('.tertiary-nav').siblings('a')
                    var nextSecondary = parentSecondary.parent().next('li').find('a').first()
                    nextSecondary.focus()
                    break
                }
                case 'ArrowDown': {
                    e.preventDefault()
                    var nextLink = $(e.target).parent().next('li').find('a')
                    nextLink.focus()
                    break
                }
                case 'Enter':
                case ' ': { // spacebar
                    e.preventDefault()
                    e.target.click()
                    break
                }
            }
        })

    // show nav card on mouseover for main menu entry
    $('.primary-nav a')
        .mouseenter(function (e) { showCard(e.target.id) })

    // hide all nav cards when we leave the nav
    $('.nav-wrap')
        .mouseleave(function () { hideCards() })

    function showCard(id) {
        hideCards() // hide others
        $('.nav-card.menu-' + id).show()
        $('#' + id).attr('aria-expanded', true)
    }

    function hideCards() {
        $('.primary-nav a').attr('aria-expanded', false)
        $('.nav-card').hide()
    }

    /*
     * Homepage carousel
     */

    var changeSlide = function (toIndex) {
        // show the slide
        $('#carousel .post-update.active').removeClass('active')
        $('#carousel .post-update').eq(toIndex).addClass('active')
        // highlight the button
        $('#post-controls a div.active').removeClass('active')
        $('#post-controls a div').eq(toIndex).addClass('active')
    }

    $('#post-controls a').each(function (i, button) {
        $(button).click(function () {
            changeSlide(i)
            // restart the autoplay "timer" from zero
            clearInterval(playerID)
            playerID = startAutoplay()
        })
    })

    // TODO maybe make mouseenter/mouseleave clear/reset autoplay - 
    // thus hovering would "freeze" the slideshow

    // autoplay function
    var startAutoplay = function () {
        return setInterval(function () {
            var activeIndex = $('#post-controls a div.active').data('index')
            var newIndex = (activeIndex + 1) % $('#post-controls a').length
            changeSlide(newIndex)
        }, 5000) // autoplay slide time is 5s
    }

    // start autoplay if there's more than one slide
    if ($('#carousel .post-update').length > 1) {
        var playerID = startAutoplay()
    }

});
