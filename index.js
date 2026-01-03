/* ===============================
   SESSION METADATA
================================ */
const sessionId = crypto.randomUUID();
const pageLoadTime = performance.now();
let consentGiven = false;

/* ===============================
   RAW EVENT STORES
================================ */
const mouseMoves = [];
const scrollEvents = [];
const keyEvents = [];
const clickEvents = [];
const networkEvents = [];

let firstActionTime = null;

/* ===============================
   CONSENT
================================ */
document.getElementById("consent").addEventListener("change", e => {
    consentGiven = e.target.checked;
});

/* ===============================
   UTIL
================================ */
function markFirstAction() {
    if (firstActionTime === null) {
        firstActionTime = performance.now();
    }
}

/* ===============================
   MOUSE TRACKING
================================ */
let lastMouse = null;

document.addEventListener("mousemove", e => {
    if (!consentGiven) return;
    markFirstAction();

    const now = performance.now();

    if (lastMouse) {
        mouseMoves.push({
            dx: e.clientX - lastMouse.x,
            dy: e.clientY - lastMouse.y,
            dt: now - lastMouse.t,
            x: e.clientX,
            y: e.clientY
        });
    }

    lastMouse = { x: e.clientX, y: e.clientY, t: now };
});

/* ===============================
   CLICK TRACKING
================================ */
document.addEventListener("click", e => {
    if (!consentGiven) return;
    markFirstAction();

    clickEvents.push({
        t: performance.now(),
        tag: e.target.tagName
    });
});

/* ===============================
   SCROLL TRACKING
================================ */
let lastScrollY = window.scrollY;
let lastScrollTime = performance.now();

document.addEventListener("scroll", () => {
    if (!consentGiven) return;
    markFirstAction();

    const now = performance.now();
    const currentY = window.scrollY;

    scrollEvents.push({
        dy: currentY - lastScrollY,
        y: currentY,
        dt: now - lastScrollTime
    });

    lastScrollY = currentY;
    lastScrollTime = now;
});
function decisionClicked() {
    if (!consentGiven) return;
    markFirstAction();
    clickEvents.push({
        t: performance.now(),
        tag: "DECISION_BUTTON"
    });
}

/* ===============================
   KEYBOARD TIMING (NO TEXT)
================================ */
let lastKeyTime = null;

document.addEventListener("keydown", e => {
    if (!consentGiven) return;
    markFirstAction();

    const now = performance.now();

    keyEvents.push({
        dt: lastKeyTime ? now - lastKeyTime : null,
        isBackspace: e.key === "Backspace"
    });

    lastKeyTime = now;
});

/* ===============================
   NETWORK TIMING
================================ */
async function networkTest() {
    if (!consentGiven) return;
    markFirstAction();

    const start = performance.now();
    await fetch("https://jsonplaceholder.typicode.com/posts/1");
    const end = performance.now();

    networkEvents.push({
        latency: end - start
    });
}

/* ===============================
   FINAL PAYLOAD (RAW)
================================ */
function buildPayload() {
    return {
        sessionId,
        pageLoadTime,
        firstActionDelay: firstActionTime
            ? firstActionTime - pageLoadTime
            : null,

        mouseMoves,
        scrollEvents,
        keyEvents,
        clickEvents,
        networkEvents,

        sessionDuration: performance.now() - pageLoadTime
    };
}

/* ===============================
   SEND TO BACKEND
================================ */
function endSession() {
    if (!consentGiven) {
        alert("Please provide consent before submitting.");
        return;
    }

    fetch("http://localhost:3000/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload())
    });
   console.log(buildPayload());
    alert("Session data submitted. Thank you!");
}
