/* ================= PAGE LOADER ================= */

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    if (!loader) return;

    setTimeout(() => {

        loader.classList.add("hide");

    }, 1400);

});


/* ================= MOBILE MENU ================= */

const menuBtn =
    document.getElementById("menuBtn");

const nav =
    document.getElementById("nav");

if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {

        nav.classList.toggle("active");

    });

    document.querySelectorAll("#nav a").forEach((link) => {

        link.addEventListener("click", () => {

            nav.classList.remove("active");

        });

    });
}


/* ================= NAVBAR SCROLL ================= */

const navbar =
    document.querySelector(".navbar");


window.addEventListener("scroll", () => {

    if (!navbar) return;

    if (window.scrollY > 50) {

        navbar.classList.add("scrolled");

    } else {

        navbar.classList.remove("scrolled");

    }

});


/* ================= SCROLL REVEAL ================= */

const revealElements =
    document.querySelectorAll(
        ".section, .project-card, .skill-card, .certificate-card, .resume-section"
    );


const observer =
    new IntersectionObserver(

        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("show");

                    observer.unobserve(entry.target);

                }

            });

        },

        {
            threshold: 0.12
        }

    );


revealElements.forEach((element) => {

    element.classList.add("reveal");

    observer.observe(element);

});


/* ================= LEETCODE LEFT RIGHT REVEAL ================= */

const leetcodeElements =
    document.querySelectorAll(
        ".reveal-left, .reveal-right"
    );


const leetcodeObserver =
    new IntersectionObserver(

        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("active");

                    leetcodeObserver.unobserve(entry.target);

                }

            });

        },

        {
            threshold: 0.2
        }

    );


leetcodeElements.forEach((element) => {

    leetcodeObserver.observe(element);

});


/* ================= NUMBER COUNTER ================= */

const counters =
    document.querySelectorAll(".counter");


const counterObserver =
    new IntersectionObserver(

        (entries) => {

            entries.forEach((entry) => {

                if (!entry.isIntersecting) return;

                const counter =
                    entry.target;

                const target =
                    Number(counter.dataset.target);

                const duration = 1800;

                const startTime =
                    performance.now();


                function updateCounter(currentTime) {

                    const progress =
                        Math.min(
                            (currentTime - startTime) / duration,
                            1
                        );


                    const ease =
                        1 - Math.pow(
                            1 - progress,
                            3
                        );


                    const value =
                        Math.floor(target * ease);


                    counter.textContent =
                        value;


                    if (progress < 1) {

                        requestAnimationFrame(
                            updateCounter
                        );

                    } else {

                        counter.textContent =
                            target;

                    }

                }


                requestAnimationFrame(
                    updateCounter
                );


                counterObserver.unobserve(
                    counter
                );

            });

        },

        {
            threshold: 0.6
        }

    );


counters.forEach((counter) => {

    counterObserver.observe(counter);

});


/* ================= EARTH PARALLAX ================= */

const earthContainer =
    document.querySelector(".earth-container");


document.addEventListener(
    "mousemove",
    (event) => {

        if (window.innerWidth < 900) return;

        if (!earthContainer) return;


        const x =
            (
                window.innerWidth / 2 -
                event.clientX
            ) / 70;


        const y =
            (
                window.innerHeight / 2 -
                event.clientY
            ) / 70;


        earthContainer.style.transform =
            `translate(${x}px, ${y}px)`;

    }
);


/* ================= CURSOR GLOW ================= */

if (window.innerWidth > 900) {

    const cursorGlow =
        document.createElement("div");

    cursorGlow.className =
        "cursor-glow";

    document.body.appendChild(
        cursorGlow
    );


    document.addEventListener(
        "mousemove",
        (event) => {

            cursorGlow.style.left =
                event.clientX + "px";

            cursorGlow.style.top =
                event.clientY + "px";

        }
    );

}


/* ================= MAGNETIC BUTTONS ================= */

const magneticButtons =
    document.querySelectorAll(
        ".btn, .resume-nav, .leetcode-button"
    );


magneticButtons.forEach((button) => {

    button.addEventListener(
        "mousemove",
        (event) => {

            if (window.innerWidth < 900) return;


            const rect =
                button.getBoundingClientRect();


            const x =
                event.clientX -
                rect.left -
                rect.width / 2;


            const y =
                event.clientY -
                rect.top -
                rect.height / 2;


            button.style.transform =
                `translate(${x * 0.10}px, ${y * 0.10}px)`;

        }
    );


    button.addEventListener(
        "mouseleave",
        () => {

            button.style.transform = "";

        }
    );

});


/* ================= 3D CARD TILT ================= */

const cards =
    document.querySelectorAll(
        ".project-card, .skill-card, .certificate-card"
    );


cards.forEach((card) => {

    card.addEventListener(
        "mousemove",
        (event) => {

            if (window.innerWidth < 900) return;


            const rect =
                card.getBoundingClientRect();


            const x =
                event.clientX - rect.left;


            const y =
                event.clientY - rect.top;


            const centerX =
                rect.width / 2;


            const centerY =
                rect.height / 2;


            const rotateX =
                ((y - centerY) / centerY) * -3;


            const rotateY =
                ((x - centerX) / centerX) * 3;


            card.style.transform =
                `perspective(900px)
                 rotateX(${rotateX}deg)
                 rotateY(${rotateY}deg)
                 translateY(-7px)`;

        }
    );


    card.addEventListener(
        "mouseleave",
        () => {

            card.style.transform = "";

        }
    );

});