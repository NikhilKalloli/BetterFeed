const FEED_TYPE_JOB_POST = 1;
const FEED_TYPE_COURSE_POST = 2;
const FEED_TYPE_ACTIVITY_POST = 3;
const FEED_TYPE_ACTIVITY_POST_SHARE = 4;
const FEED_TYPE_ACTIVITY_MUTUAL_CONNECTIONS = 5;
const FEED_TYPE_ACTIVITY_POST_REACTION = 6;
const FEED_TYPE_ACTIVITY_POST_COMMENT = 7;
const FEED_TYPE_ACTIVITY_ANNIVERSARY = 8;
const FEED_TYPE_SITE_PROMOTION = 9;

const POST_SOURCE_USER = 1;
const POST_SOURCE_COMPANY = 2;
const POST_SOURCE_HASHTAG = 3;

function listInString(list, string) {
    for (let i = 0; i < list.length; i++) {
        if (string.indexOf(list[i]) > -1) {
            return true;
        }
    }
    return false;
}

function waitForElement(selector, callback, maxWaitTime = 10000) {
    if (document.querySelector(selector)) {
        callback();
    } else {
        if (maxWaitTime <= 0) {
            console.log('Element not found: ' + selector);
            return;
        }
        setTimeout(() => {
            waitForElement(selector, callback, maxWaitTime - 100);
        }, 100);
    }
}

function init() {
    console.log('init');
    waitForElement('.feed-shared-update-v2', () => {
        let feeds = document.querySelectorAll('.feed-shared-update-v2');
        if (feeds.length === 0) {
            console.log('No feed items found');
            return;
        }
        console.log(`Found ${feeds.length} feed items`);
        // Loop through all feed elements and check the type
        feeds.forEach((feed, index) => {
            let feedInfo = {
                'source': null,
                'type': null,
            };

            // Check for different types of content
            if (feed.querySelector('.feed-shared-job-card')) {
                feedInfo['type'] = FEED_TYPE_JOB_POST;
            } else if (feed.querySelector('.feed-shared-course-card')) {
                feedInfo['type'] = FEED_TYPE_COURSE_POST;
            } else if (feed.querySelector('.feed-shared-article, .feed-shared-external-article, .feed-shared-image, .feed-shared-video, .feed-shared-text')) {
                feedInfo['type'] = FEED_TYPE_ACTIVITY_POST;
            }

            // Check for reactions, comments, etc.
            let updateHeader = feed.querySelector('.update-components-header__text-view');
            if (updateHeader) {
                let headerText = updateHeader.textContent.trim();
                if (headerText.includes('likes this')) {
                    feedInfo['type'] = FEED_TYPE_ACTIVITY_POST_REACTION;
                } else if (headerText.includes('commented on this')) {
                    feedInfo['type'] = FEED_TYPE_ACTIVITY_POST_COMMENT;
                } else if (headerText.includes('shared')) {
                    feedInfo['type'] = FEED_TYPE_ACTIVITY_POST_SHARE;
                }
            }

            // Check for shared posts
            if (feed.querySelector('.feed-shared-reshared-content')) {
                feedInfo['type'] = FEED_TYPE_ACTIVITY_POST_SHARE;
            }

            // Determine the source
            let actorName = feed.querySelector('.update-components-actor__name');
            if (actorName) {
                feedInfo['source'] = actorName.textContent.trim();
            } else {
                let headerLink = feed.querySelector('.update-components-header__text-view a');
                if (headerLink) {
                    feedInfo['source'] = headerLink.textContent.trim();
                }
            }

            // Remove duplicated names
            if (feedInfo['source']) {
                feedInfo['source'] = feedInfo['source'].replace(/(.+)\1/, '$1');
            }

            // Check for promoted content
            if (feed.textContent.includes('Promoted')) {
                feedInfo['type'] = FEED_TYPE_SITE_PROMOTION;
            }

            // If still null, set as general activity post
            if (feedInfo['type'] === null) {
                feedInfo['type'] = FEED_TYPE_ACTIVITY_POST;
            }

            console.log(`Feed item ${index}:`, feedInfo);
            console.log(`HTML:`, feed.outerHTML.slice(0, 200) + '...'); // Log a snippet of the HTML for debugging
        });
    });
}

// Run the init function when the page is fully loaded
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}

// Also run the init function periodically to catch dynamically loaded content
setInterval(init, 5000);
