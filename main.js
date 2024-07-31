const FEED_TYPE_JOB_POST = 1;
const FEED_TYPE_COURSE_POST = 2;
const FEED_TYPE_ACTIVITY_POST = 3;
const FEED_TYPE_ACTIVITY_POST_SHARE = 4;
const FEED_TYPE_ACTIVITY_MUTUAL_CONNECTIONS = 5;
const FEED_TYPE_ACTIVITY_POST_REACTION = 6;
const FEED_TYPE_ACTIVITY_POST_COMMENT = 7;
const FEED_TYPE_ACTIVITY_ANNIVERSARY = 8;
const FEED_TYPE_SITE_PROMOTION = 9;

let checkboxStates = {};

function listInString(list, string) {
    for (let i = 0; i < list.length; i++) {
        if (string.indexOf(list[i]) > -1) {
            return true;
        }
    }
    return false;
}

function getFeedType(feed) {
    let feedType = null;

    // Check for different types of content
    if (feed.querySelector('.feed-shared-job-card')) {
        feedType = FEED_TYPE_JOB_POST;
    } else if (feed.querySelector('.feed-shared-course-card')) {
        feedType = FEED_TYPE_COURSE_POST;
    } else if (feed.querySelector('.feed-shared-article, .feed-shared-external-article, .feed-shared-image, .feed-shared-video, .feed-shared-text')) {
        feedType = FEED_TYPE_ACTIVITY_POST;
    }

    // Check for reactions, comments, etc.
    let updateHeader = feed.querySelector('.update-components-header__text-view');
    if (updateHeader) {
        let headerText = updateHeader.textContent.trim();
        if (headerText.includes('likes this')) {
            feedType = FEED_TYPE_ACTIVITY_POST_REACTION;
        } else if (headerText.includes('commented on this')) {
            feedType = FEED_TYPE_ACTIVITY_POST_COMMENT;
        } else if (headerText.includes('shared')) {
            feedType = FEED_TYPE_ACTIVITY_POST_SHARE;
        }
    }

    // Check for shared posts
    if (feed.querySelector('.feed-shared-reshared-content')) {
        feedType = FEED_TYPE_ACTIVITY_POST_SHARE;
    }

    // Check for promoted content
    if (feed.textContent.includes('Promoted')) {
        feedType = FEED_TYPE_SITE_PROMOTION;
    }

    // If still null, set as general activity post
    if (feedType === null) {
        feedType = FEED_TYPE_ACTIVITY_POST;
    }

    return feedType;
}

function displayFeedInfo(feedInfoList) {
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
        <form id="feed-type-form">
    `;

    html += `
        <p>All: ${feedInfoList.length}</p>
    `;
    
    for (let type in typeCounts) {
        let typeName = getFeedTypeName(parseInt(type));
        checkboxStates[type] = checkboxStates[type] !== undefined ? checkboxStates[type] : true;
        html += `
            <div>
                <input type="checkbox" id="type-${type}" name="type-${type}" ${checkboxStates[type] ? 'checked' : ''}>
                <label for="type-${type}">${typeName}: ${typeCounts[type]}</label>
            </div>
        `;
    }
    
    displayContainer.innerHTML = html;

    document.getElementById('feed-type-form').addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            let feedType = parseInt(e.target.id.split('-')[1]);
            checkboxStates[feedType] = e.target.checked;
            applyFilter();
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

function applyFilter() {
    let feedItems = document.querySelectorAll('[data-id^="urn:li:activity"], [data-id^="urn:li:aggregate"]');
    feedItems.forEach(item => {
        let itemType = getFeedType(item);
        item.style.display = checkboxStates[itemType] ? 'block' : 'none';
    });
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
    applyFilter();
}

// Run the init function when the page is fully loaded
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}

// Also run the init function periodically to catch dynamically loaded content
setInterval(init, 3000);