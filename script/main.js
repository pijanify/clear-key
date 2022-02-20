var expectedEncryptedEvents = 2
var config = [{
    initDataTypes: ['cenc'],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.640029"' }],
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }]
}];

var html5video = document.getElementById("html5video");

navigator.requestMediaKeySystemAccess('org.w3.clearkey', config
).then(
    function (keySystemAccess) {
        var promise = keySystemAccess.createMediaKeys();
        promise.catch(
            function (error) {
                console.error("Unable to create MediaKeys : " +
                    error);
            }
        );
        promise.then(
            function (createdMediaKeys) {
                return html5video.setMediaKeys(createdMediaKeys);
            }
        ).then(
            function (mediaKeys) {
                console.warn("Successfully set MediaKeys on video object");
                playMedia();
            }
        ).catch(
            function (error) {
                console.error("Unable to set MediaKeys on " +
                    "video object : " + error);
            }
        );
    }
).catch(
    function (error) {
        console.error("Error while" +
            "initializing media key system : " + error);
    }
);


function playMedia() {
    html5video.addEventListener('playing', onPlaying, false)
    try {
        html5video.addEventListener("encrypted", handleEncrypted, false);
    } catch (err) {
        console.error("Error while adding an event listener for 'encrypted' event on video element. Error: " +
            err.message);
    }
    html5video.play()
}


function handleEncrypted(e) {
    if (--expectedEncryptedEvents === 0) {
        html5video.removeEventListener("encrypted", handleEncrypted, false);
    }
    console.warn('Media is Encrypted : ' + e)

    // get the mediaKeys from html5video
    var mediaKeys = html5video.mediaKeys;

    //fail the test if the mediaKeys are not set on html5video
    if (mediaKeys === null || mediaKeys === undefined) {
        console.error("MediaKeys set on html5video is " + mediaKeys);
    }

    // create and initialize session
    var keySession = mediaKeys.createSession();
    try {
        keySession.addEventListener("message", handleMessage, false);
    } catch (err) {
        console.error("Unable to add 'message' " +
            "event listener to the keySession object. Error: " + err.message);
    }
    var promise = keySession.generateRequest(event.initDataType, event.initData)
    promise.catch(
        function (error) {
            console.error("Unable to create or " +
                "initialize key session. Error : " + error);
        }
    );
}


function handleMessage(event) {
    console.info(event)
    var keySession = event.target;
    console.warn('MediaKeySession : ' + event.target);
    var te = new TextEncoder();
    var license = te.encode('{"keys":[{"kty":"oct","k":"453b01beb73c78bd6f8ad380f8a06a8e","kid":"897aa91ee5958140b5ebd8076cced310"}],"type":"temporary"}');
    keySession.update(license).catch(
        function (error) {
            console.error('Failed to update the session', error);
        }
    );
}


function onPlaying() {
    console.warn('Media started playing')
}
