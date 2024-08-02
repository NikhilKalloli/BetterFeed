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

    if (feed.querySelector('.feed-shared-job-card')) {
        feedType = FEED_TYPE_JOB_POST;
    } else if (feed.querySelector('.feed-shared-course-card')) {
        feedType = FEED_TYPE_COURSE_POST;
    } else if (feed.querySelector('.feed-shared-article, .feed-shared-external-article, .feed-shared-image, .feed-shared-video, .feed-shared-text')) {
        feedType = FEED_TYPE_ACTIVITY_POST;
    }

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

    if (feed.querySelector('.feed-shared-reshared-content')) {
        feedType = FEED_TYPE_ACTIVITY_POST_SHARE;
    }

    if (feed.textContent.includes('Promoted')) {
        feedType = FEED_TYPE_SITE_PROMOTION;
    }

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
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 16px;
            z-index: 9999;
            max-height: 80vh;
            overflow-y: auto;
            width: 250px;
            cursor: move;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
        `;
        document.body.appendChild(displayContainer);
        // console.log('Display container created');

        makeDraggable(displayContainer);
    }

    let typeCounts = {};
    feedInfoList.forEach(feedType => {
        typeCounts[feedType] = (typeCounts[feedType] || 0) + 1;
    });

    let html = `
        <style>
            #linkedin-feed-info, #linkedin-feed-info * {
                color: #333 !important;
            }
            #linkedin-feed-info h3, #linkedin-feed-info h4 {
                color: #0a66c2 !important;
                margin-bottom: 12px;
                font-weight: 600;
            }
            #linkedin-feed-info form div {
                margin-bottom: 8px;
            }
            #linkedin-feed-info input[type="checkbox"] {
                margin-right: 8px;
            }
            #linkedin-feed-info label {
                font-size: 14px;
            }
            #reset-position {
                background-color: #0a66c2;
                color: white !important;
                border: none;
                padding: 8px 16px;
                border-radius: 16px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                margin-top: 16px;
                transition: background-color 0.3s ease;
            }
            #reset-position:hover {
                background-color: #004182;
            }
        </style>
        <form id="feed-type-form">
    `;

    html += `
        <p style="font-size: 14px; margin-bottom: 12px;">Total Posts: ${feedInfoList.length}</p>
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

    html += `
        <button id="reset-position">Reset Position</button>
    `;
    
    displayContainer.innerHTML = html;

    document.getElementById('feed-type-form').addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            let feedType = parseInt(e.target.id.split('-')[1]);
            checkboxStates[feedType] = e.target.checked;
            applyFilter();
        }
    });

    document.getElementById('reset-position').addEventListener('click', function(e) {
        e.preventDefault();
        resetContainerPosition();
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

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        isDragging = true;
        document.addEventListener('mousemove', elementDrag);    
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mouseleave', handleMouseLeave);
        // console.log('Drag started:', {x: pos3, y: pos4, isDragging});
    }

    function elementDrag(e) {
        if (!isDragging) {
            // console.log('Drag attempted but isDragging is false');
            return;
        }
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        
        newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));
        newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
        
        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
        element.style.right = 'auto';
        
        // console.log('Dragging:', {top: newTop, left: newLeft, isDragging});
    }

    function closeDragElement() {
        isDragging = false;
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mouseleave', handleMouseLeave);
        let position = {
            top: element.style.top,
            left: element.style.left
        };
        localStorage.setItem('linkedinFeedInfoPosition', JSON.stringify(position));
        // console.log('Drag ended, saved position:', position, {isDragging});
    }

    function handleMouseLeave(e) {
        if (isDragging) {
            // console.log('Mouse left window during drag');
            closeDragElement();
        }
    }

    // Remove the periodic check as it's no longer necessary
    // The event listeners will handle all cases properly now
}

function restoreContainerPosition() {
    let displayContainer = document.getElementById('linkedin-feed-info');
    if (displayContainer) {
        let savedPosition = localStorage.getItem('linkedinFeedInfoPosition');
        // console.log('Restoring position, saved data:', savedPosition);
        if (savedPosition) {
            savedPosition = JSON.parse(savedPosition);
            let top = parseInt(savedPosition.top);
            let left = parseInt(savedPosition.left);
            
            // console.log('Parsed position:', {top, left});
            
            if (isNaN(top) || isNaN(left) || top < 0 || top > window.innerHeight - 100 || left < 0 || left > window.innerWidth - 100) {
                // console.log('Position out of bounds, resetting');
                resetContainerPosition();
            } else {
                displayContainer.style.top = top + "px";
                displayContainer.style.left = left + "px";
                displayContainer.style.right = 'auto';
                // console.log('Position restored:', {top, left});
            }
        } else {
            // console.log('No saved position, resetting');
            resetContainerPosition();
        }
    }
}

function resetContainerPosition() {
    let displayContainer = document.getElementById('linkedin-feed-info');
    if (displayContainer) {
        let top = '300px';
        let left = (window.innerWidth - 493) + 'px';
        displayContainer.style.top = top;
        displayContainer.style.left = left;
        displayContainer.style.right = 'auto';
        localStorage.removeItem('linkedinFeedInfoPosition');
        // console.log('Position reset to:', {top, left});
    }
}

function isLinkedInFeedPage() {
    return window.location.pathname === '/feed/' || 
           (window.location.pathname === '/feed' && window.location.search !== '');
  }

function showDisplayContainer() {
    const container = document.getElementById('linkedin-feed-info');
    if (container) {
        container.style.display = 'block';
    }
}

function hideDisplayContainer() {
    const container = document.getElementById('linkedin-feed-info');
    if (container) {
        container.style.display = 'none';
    }
}

function init() {
    if (!isLinkedInFeedPage()) {
        console.log('Not on LinkedIn feed page. Extension not initialized.');
        hideDisplayContainer();
        return;
      }
    
    let feedItems = document.querySelectorAll('.feed-shared-update-v2, .occludable-update, .feed-shared-update-v2__content');
    if (feedItems.length === 0) {
        return;
    }
    
    let feedInfoList = [];

    feedItems.forEach((feed, index) => {
        let feedType = getFeedType(feed);
        feedInfoList.push(feedType);
    });

    displayFeedInfo(feedInfoList);
    applyFilter();
    restoreContainerPosition();
    showDisplayContainer();
}

if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}

setInterval(init, 2500);