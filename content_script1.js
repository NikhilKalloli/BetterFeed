const FEED_TYPE_JOB_POST = 1;
const FEED_TYPE_COURSE_POST = 2;
const FEED_TYPE_ACTIVITY_POST = 3;
const FEED_TYPE_ACTIVITY_POST_SHARE = 4;
const FEED_TYPE_ACTVITY_MUTUAL_CONNECTIONS = 5;
const FEED_TYPE_ACTVITY_POST_REACTION = 6;
const FEED_TYPE_ACTVITY_POST_COMMENT = 7;
const FEED_TYPE_ACTVITY_ANNIVERSARY = 8;
const FEED_TYPE_SITE_PROMOTION = 9;

const POST_SOURCE_USER = 1;
const POST_SOURCE_COMPANY = 2;
const POST_SOURCE_HASHTAG = 3;


function listInString(list,string) {
    for (let i = 0; i < list.length; i++) {
        if (string.indexOf(list[i])>-1){
            return true
        }
    }

    return false
}


function init() {
    // let paragraphs = document.getElementsByClassName("ade");
    // // console.log(paragraphs);
    // for (elt of paragraphs) {
    //     elt.insertBefore(constructOptions(spanImage), elt.Child);
    // }
    console.log('init');

    let feedContainer = document.querySelector('.core-rail').lastElementChild;
    let feeds = feedContainer.children;

    // Loop through all feed elements and check the type
    for (let i = 0; i < feeds.length; i++) {
        let feed = feeds[i];
        if (feed.tagName !== 'DIV')continue;

        let feedInfo = {
            'source':null,
            'type':null,
        };

        // First use the feed data-id for this general groups
        let dataId = feed.getAttribute('data-id');

        // 1. Jobs recommended for you
        // e.g data-id = urn:li:aggregate:(urn:li:jobPosting:1921774453,urn:li:jobPosting:1921358091,urn:li:jobPosting:1920854857,urn:li:jobPosting:1921168260,urn:li:jobPosting:1920714473)
        if (dataId.indexOf('urn:li:jobPosting')>-1){
            // console.log('');
            feedInfo['type'] = FEED_TYPE_JOB_POST
        }
        // 2. Learn more about Programming Languages
        // e.g data-id = urn:li:lyndaCourse:661771
        else if (dataId.indexOf('urn:li:lyndaCourse')>-1){
            feedInfo['type'] = FEED_TYPE_COURSE_POST
        }
        // 3. Activity
        // e.g data-id = urn:li:activity:6680252338160078849
        else if (dataId.indexOf('urn:li:activity')>-1) {
            // An Activity can be from a LinkedIn User, Company or Hashtag
            // Account Activity posts can be of 2 main types :

            // 1. Direct account Post
            // Direct activity done by connections
            // These do not have a header section before the main post
            // The first element in the feed root is the post creator - has the class feed-shared-actor--with-control-menu

            // Getting the header section
            // Start with getting the feed root
            let tmp = feed.firstElementChild;
            // feed-shared-update-v2
            let feedRoot = null;
            if(tmp.classList.contains('feed-shared-update-v2')){
                feedRoot = tmp;
            }else {
                feedRoot = tmp.firstElementChild;
            }

            if (feedRoot == null){
                // THE POST HASN'T BEEN LOADED YET
                continue;

            }

            let headerSection = feedRoot.firstElementChild;
            // check class existence
            if (headerSection.classList.contains('feed-shared-actor--with-control-menu')) {
                // Direct account Posts are of 2 types
                // 1.1 Basic Post Created from "Start Post"
                feedInfo['type'] = FEED_TYPE_ACTIVITY_POST

                // 1.2 Re-share of another account's Post
                // TODO feedInfo['type'] = FEED_TYPE_ACTIVITY_POST_SHARE

            }

            // 2. Activity about a direct account post
            // These have a header section before the main post
            // check class existence -  feed-shared-header--with-divider
            else if (headerSection.classList.contains('feed-shared-header--with-divider')) {
                // This post type can be further identified by the text in the header
                let headerText = headerSection.textContent;

                // 2.1 Posts from Accounts most of your connection follow
                // Header text contains "and 10 other connections follow"
                if (headerText.indexOf('connections follow') > -1) {
                    feedInfo['type'] = FEED_TYPE_ACTVITY_MUTUAL_CONNECTIONS;
                }

                // 2.2 A reaction on a post by your connection
                // e.g Peter Muthaka celebrates this
                // Header text contains "loves this" , "likes this" , "celebrates this"
                else if (listInString(['likes this', 'celebrates this', 'loves this'], headerText)) {
                    feedInfo['type'] = FEED_TYPE_ACTVITY_MUTUAL_CONNECTIONS;
                }

                // 2.3 A comment on a post by your connection
                // e.g Obare Geoffrey commented on this
                // Header text contains "commented on this"
                else if (headerText.indexOf('commented on this') > -1) {
                    feedInfo['type'] = FEED_TYPE_ACTVITY_POST_COMMENT;

                }

                // 2.4 A required congratulations on a work anniversary
                // e.g Congratulate Pius Gitonga on their work anniversary
                // Header text contains "Congratulate "
                else if (headerText.indexOf('Congratulate') > -1) {
                    feedInfo['type'] = FEED_TYPE_ACTVITY_ANNIVERSARY;

                }
                else {
                    console.log(`NOT IMPLEMENTED headerText:${headerText}`)
                }
            }

        // 4. Site Promotion
        // e.g Search for jobs that need you
        // e.g urn:li:l2mPromotion:galapagos:hom-fd:cns_car_job_search
        }else if (dataId.indexOf('urn:li:l2mPromotion')>-1){
            feedInfo['type'] = FEED_TYPE_SITE_PROMOTION;
        }else {
            console.log(`NOT IMPLEMENTED data-id: ${dataId}`)
        }

        console.log(feedInfo);

    }
}

document.onreadystatechange = function () {
    if (document.readyState === 'complete') {
        init()
    }
};

