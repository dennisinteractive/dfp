(function ($) {
    "use strict";

    $.fn.isInViewport = function() {
        if ($(this).length === 0) {
            return false;
        }
        var elementTop = $(this).offset().top;
        var elementBottom = elementTop + $(this).outerHeight();
        var viewportTop = $(window).scrollTop();
        var viewportBottom = viewportTop + $(window).height();
        return elementBottom > viewportTop && elementTop < viewportBottom;
    };

})(jQuery);
