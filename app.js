"use strict";

const youtubeBaseUrl = 'https://www.youtube.com'

let player;
let globalStartValue;
let globalEndValue;
let globalVideoId;
let globalUpdateByUser;

window.onload = function () {
    isUrlInputValid()

    const tag = document.createElement('script');
    tag.src = `${youtubeBaseUrl}/iframe_api`;

    const firstScriptTag = document.getElementsByTagName('script')[0];

    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};

function isStartInputValid() {
    const start = document.getElementById('start');
    const button = document.getElementById("submit");

    if (start.validity.valid) {
        start.setAttribute('aria-invalid', null)

        button.disabled = false;
        button.classList.remove("disabled")

        return true;
    } else {
        start.setAttribute('aria-invalid', "true")

        button.disabled = true;
        button.classList.add("disabled")

        return false;
    }
}

function isEndInputValid() {
    const end = document.getElementById('end');
    const start = document.getElementById('start');
    const button = document.getElementById("submit");

    const startIsBeforeEnd = (getHhMmSsAsSeconds(start) <= getHhMmSsAsSeconds(end)) || getHhMmSsAsSeconds(end) === 0;
    if (end.validity.valid && startIsBeforeEnd) {
        end.setAttribute('aria-invalid', null)

        button.disabled = false;
        button.classList.remove("disabled")

        return true;
    } else {
        end.setAttribute('aria-invalid', "true")

        button.disabled = true;
        button.classList.add("disabled")

        return false;
    }
}

function getSecondsAsHhMmSS(seconds) {
    if (seconds < 3600) {
        return new Date(seconds * 1000).toISOString().slice(14, 19);
    } else {
        return new Date(seconds * 1000).toISOString().slice(11, 19);
    }
}

function getHhMmSsAsSeconds(inputElement) {
    const HhMmSs = inputElement.validity.valid && inputElement.value !== "" ? inputElement.value : "0";

    return Number(HhMmSs.split(':').reduce((acc, time) => (60 * acc) + +time));
}

function userUpdateVideo() {
    if (!isStartInputValid() || !isEndInputValid() || !isUrlInputValid()) {
        return;
    }

    const newUrl = new URL(document.getElementById('youtube-url').value.trim());
    const videoId = newUrl.searchParams.get('v')

    const startElement = document.getElementById('start');
    const endElement = document.getElementById('end');

    const start = getHhMmSsAsSeconds(startElement);
    const end = getHhMmSsAsSeconds(endElement);

    player.loadVideoById({
        'videoId': videoId,
        'startSeconds': start,
        'endSeconds': end
    });

    startElement.value = getSecondsAsHhMmSS(start);
    endElement.value = getSecondsAsHhMmSS(end);

    globalStartValue = start;
    globalEndValue = end;
    globalVideoId = videoId
    generatePersonalizedLink(videoId, start, end)

    globalUpdateByUser = true;
}

function isUrlInputValid() {
    const button = document.getElementById("submit");
    const urlInput = document.getElementById("youtube-url");

    if (urlInput.validity.valid && urlInput.value !== "") {
        button.disabled = false;
        button.classList.remove("disabled")
        urlInput.setAttribute('aria-invalid', null)

        return true;
    } else {
        button.disabled = true;
        button.classList.add("disabled")
        urlInput.setAttribute('aria-invalid', "true")

        return false;
    }
}

function onPlayerStateChange() {
    if (player.getPlayerState() === YT.PlayerState.ENDED) {
        const startElement = document.getElementById('start');
        const endElement = document.getElementById('end');

        if (globalUpdateByUser) {
            if (getHhMmSsAsSeconds(startElement) >= player.getDuration()) {
                startElement.value = "00:00:00"
            }

            if (getHhMmSsAsSeconds(endElement) > player.getDuration()) {
                endElement.value = getSecondsAsHhMmSS(player.getDuration())
            }
        }

        player.loadVideoById({
            'videoId': globalVideoId,
            'startSeconds': globalUpdateByUser ? startElement.value : globalStartValue,
            'endSeconds': globalUpdateByUser ? endElement.value : globalEndValue
        });

        globalUpdateByUser = false;
    }
}

function generatePersonalizedLink(videoId, start, end) {
    const copyToClipboard = document.getElementById('copy-to-clipboard');
    copyToClipboard.classList.remove('hidden')

    const url = new URL(window.location.href.split("?")[0]);

    url.searchParams.append('videoId', videoId)
    url.searchParams.append('start', start)
    url.searchParams.append('end', end)

    const link = document.getElementById('clipboard-icon');
    link.setAttribute('data-tooltip', url.href);
}

function applyPersonalizedLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('videoId')
    let start = urlParams.get('start')
    let end = urlParams.get('end')

    if (videoId && start && end) {
        console.log('applyPersonalizedLink');
        document.getElementById('start').value = getSecondsAsHhMmSS(start);
        document.getElementById('end').value = getSecondsAsHhMmSS(end);
        document.getElementById('youtube-url').value = `${youtubeBaseUrl}/watch?v=${videoId}`;

        userUpdateVideo()
    }
}

function copyLink() {
    const clipboardIcon = document.getElementById('clipboard-icon');

    navigator.clipboard.writeText(clipboardIcon.getAttribute('data-tooltip')).then();
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        host: 'https://www.youtube-nocookie.com',
        videoId: 'y5fwvYICZvY',
        playerVars: {
            'playsinline': 1,
        },
        events: {
            'onStateChange': onPlayerStateChange,
            'onReady': applyPersonalizedLink
        }
    });
}
