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

function displayFeedInfo(feedInfoList) {
    // Create or get the display container
    let displayContainer = document.getElementById('linkedin-feed-info');
    if (!displayContainer) {
        displayContainer = document.createElement('div');
        displayContainer.id = 'linkedin-feed-info';
        displayContainer.style.cssText = `
            position: fixed;
            top: 300px;
            right: 193px;
            background-color: white;
            border: 1px solid #ccc;
            padding: 10px;
            z-index: 9999;
            max-height: 80vh;
            overflow-y: auto;
            width: 300px;
            
        `;
        document.body.appendChild(displayContainer);
    }

    // Count feed types
    let typeCounts = {};
    feedInfoList.forEach(feedInfo => {
        typeCounts[feedInfo.type] = (typeCounts[feedInfo.type] || 0) + 1;
    });

    // Create the HTML content
    let html = `
        <style>
            #linkedin-feed-info, #linkedin-feed-info * {
                color: black !important;
            }
            #linkedin-feed-info h3, #linkedin-feed-info h4 {
                color: black !important;
                margin-bottom: 10px;
            }
            #linkedin-feed-info form div {
                margin-bottom: 5px;
            }
        </style>
        <form>
    `;
    html += `
    </form>
    <p>All ${feedInfoList.length}</p>
    `;
    for (let type in typeCounts) {
        let typeName = getFeedTypeName(parseInt(type));
        html += `
            <div>        
                <input type="checkbox" id="type-${type}" name="type-${type}" checked>
                <label for="type-${type}">${typeName}: ${typeCounts[type]}</label>
            </div>
        `;
    }
    

    // Update the display container
    displayContainer.innerHTML = html;
}

function getFeedTypeName(type) {
    switch (type) {
        case FEED_TYPE_JOB_POST: return 'Job Post';
        case FEED_TYPE_COURSE_POST: return 'Course Post';
        case FEED_TYPE_ACTIVITY_POST: return 'Activity Post';
        case FEED_TYPE_ACTIVITY_POST_SHARE: return 'Shared Post';
        case FEED_TYPE_ACTIVITY_MUTUAL_CONNECTIONS: return 'Mutual Connections';
        case FEED_TYPE_ACTIVITY_POST_REACTION: return 'Post Reaction';
        case FEED_TYPE_ACTIVITY_POST_COMMENT: return 'Post Comment';
        case FEED_TYPE_ACTIVITY_ANNIVERSARY: return 'Anniversary';
        case FEED_TYPE_SITE_PROMOTION: return 'Promoted Content';
        default: return 'Unknown';
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
        
        let feedInfoList = [];

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

            feedInfoList.push(feedInfo);
            console.log(`Feed item ${index}:`, feedInfo);
        });

        // Display the feed info on the UI
        displayFeedInfo(feedInfoList);
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