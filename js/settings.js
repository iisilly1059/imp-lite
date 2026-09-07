(function () {
    const mode = parseInt(localStorage.getItem('performanceMode') || '0');
    document.documentElement.setAttribute('data-perf', mode);

    const tabTitle = localStorage.getItem('tabTitle');
    if (tabTitle) document.title = tabTitle;

    const panicKey = localStorage.getItem('panicKey') || 'Escape';
    const panicUrl = localStorage.getItem('panicUrl') || 'https://google.com';

    document.addEventListener('keydown', function (e) {
        if (e.key === panicKey) {
            window.location.href = panicUrl;
        }
    }, true);

    function enableAntiClose() {
        window.addEventListener('beforeunload', onBeforeUnload);
    }

    function disableAntiClose() {
        window.removeEventListener('beforeunload', onBeforeUnload);
    }

    function onBeforeUnload(e) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }

    if (localStorage.getItem('antiClose') === 'true') {
        enableAntiClose();
    }

    window.addEventListener('storage', function (e) {
        if (e.key === 'performanceMode') {
            document.documentElement.setAttribute('data-perf', parseInt(e.newValue || '0'));
        }
        if (e.key === 'tabTitle') {
            if (e.newValue) document.title = e.newValue;
        }
        if (e.key === 'antiClose') {
            e.newValue === 'true' ? enableAntiClose() : disableAntiClose();
        }
        if (e.key === 'panicKey' || e.key === 'panicUrl') {
            location.reload();
        }
    });
})();
