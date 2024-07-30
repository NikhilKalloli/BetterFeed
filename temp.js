const FEED_TYPE_JOB_POST = 1;
const FEED_TYPE_COURSE_POST = 2;
const FEED_TYPE_ACTIVITY_POST = 3;
const FEED_TYPE_ACTIVITY_POST_SHARE = 4;
const FEED_TYPE_ACTIVITY_MUTUAL_CONNECTIONS = 5;
const FEED_TYPE_ACTIVITY_POST_REACTION = 6;
const FEED_TYPE_ACTIVITY_POST_COMMENT = 7;
const FEED_TYPE_ACTIVITY_ANNIVERSARY = 8;
const FEED_TYPE_SITE_PROMOTION = 9;

function listInString(list, string) {
    for (let i = 0; i < list.length; i++) {
        if (string.indexOf(list[i]) > -1) {
            return true;
        }
    }
    return false;
}

function getFeedType(feed) {
    // console.log('Analyzing feed item:', feed);

    // Log the entire innerHTML of the feed item for debugging
    // console.log('Feed innerHTML:', feed.innerHTML);

    // Check for job posts
    if (feed.innerHTML.includes('job') || feed.innerHTML.includes('hiring')) {
        return FEED_TYPE_JOB_POST;
    }

    // Check for course posts
    if (feed.innerHTML.includes('course') || feed.innerHTML.includes('learning')) {
        return FEED_TYPE_COURSE_POST;
    }

    // Check for promoted content
    if (feed.innerHTML.includes('Promoted')) {
        return FEED_TYPE_SITE_PROMOTION;
    }

    // Try different selectors for the header text
    let headerText = feed.querySelector('span[dir="ltr"]')?.textContent || 
                     feed.querySelector('.feed-shared-actor__sub-description')?.textContent ||
                     feed.querySelector('.feed-shared-actor__description')?.textContent || '';

    console.log('Header text found:', headerText);

    // Check for reactions
    if (headerText.includes('like') || headerText.includes('celebrate') || headerText.includes('love')) {
        return FEED_TYPE_ACTIVITY_POST_REACTION;
    }

    // Check for comments
    if (headerText.includes('comment')) {
        return FEED_TYPE_ACTIVITY_POST_COMMENT;
    }

    // Check for mutual connections
    if (headerText.includes('connections') || headerText.includes('follow')) {
        return FEED_TYPE_ACTIVITY_MUTUAL_CONNECTIONS;
    }

    // Check for anniversaries
    if (headerText.includes('Congratulate') || headerText.includes('anniversary')) {
        return FEED_TYPE_ACTIVITY_ANNIVERSARY;
    }

    // Check for shared posts
    if (feed.innerHTML.includes('shared') || feed.querySelector('.feed-shared-reshared-content')) {
        return FEED_TYPE_ACTIVITY_POST_SHARE;
    }

    // If none of the above, it's a regular activity post
    return FEED_TYPE_ACTIVITY_POST;
}

function displayFeedInfo(feedInfoList) {
    let displayContainer = document.getElementById('linkedin-feed-info');
    if (!displayContainer) {
        displayContainer = document.createElement('div');
        displayContainer.id = 'linkedin-feed-info';
        displayContainer.style.cssText = `
            position: fixed;
            top: 100px;
            right: 10px;
            background-color: white;
            border: 1px solid #ccc;
            padding: 10px;
            z-index: 9999;
            max-height: 80vh;
            overflow-y: auto;
        `;
        document.body.appendChild(displayContainer);
    }

    let typeCounts = {};
    feedInfoList.forEach(feedType => {
        typeCounts[feedType] = (typeCounts[feedType] || 0) + 1;
    });

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
        <h3>LinkedIn Feed Info</h3>
        <h4>Feed Type Counts:</h4>
        <form id="feed-type-form">
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
    
    html += `
        </form>
        <p>Total feed items: ${feedInfoList.length}</p>
    `;

    displayContainer.innerHTML = html;

    document.getElementById('feed-type-form').addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            let feedType = parseInt(e.target.id.split('-')[1]);
            let feedItems = document.querySelectorAll('[data-id^="urn:li:activity"], [data-id^="urn:li:aggregate"]');
            feedItems.forEach(item => {
                let itemType = getFeedType(item);
                if (itemType === feedType) {
                    item.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
    });
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
    let feedItems = document.querySelectorAll('.feed-shared-update-v2, .occludable-update, .feed-shared-update-v2__content');
    if (feedItems.length === 0) {
        console.log('No feed items found');
        return;
    }
    console.log(`Found ${feedItems.length} feed items`);
    
    let feedInfoList = [];

    feedItems.forEach((feed, index) => {
        console.log(`Analyzing feed item ${index}:`);
        let feedType = getFeedType(feed);
        feedInfoList.push(feedType);
        console.log(`Feed item ${index} type:`, getFeedTypeName(feedType));
    });

    displayFeedInfo(feedInfoList);
}
// Run the init function when the page is fully loaded
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}

// Also run the init function periodically to catch dynamically loaded content
setInterval(init, 3000);