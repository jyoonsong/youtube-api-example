document.querySelector("#input button").onclick = function () {
  /* URL 입력시 ID 부분 추출 */
  var channelUrl = document.querySelector("#input input").value;
  pathname = new URL(channelUrl).pathname.split("/");
  var channelId = pathname[pathname.indexOf("channel") + 1];
  /* 정안되면 수동으로 */
  //      var channelId = "UC_HRnyL-pcrDd0xvlnJdkrQ";
  /* ajax실행함수 */
  getData(channelId, channelUrl);
}

function getData(channelId, url) {
  var description, playlistsId;
  var recentVideoCount = 0;
  var diffAllowed = 50;
  var minVideoCount = 3;
  /* Channel */
  $.ajax({
    url: "https://www.googleapis.com/youtube/v3/channels?part=contentDetails%2Cstatistics%2Csnippet%2CtopicDetails&maxResults=50&id=" + channelId + "&key=AIzaSyAyvig5VkfPt_lBR4sFl-ajsULtgUHmTwA",
    dataType: "jsonp",
    error: function (err) {
      document.querySelector("#msg").innerHTML = "Error: " + err;
    },
    success: function (data) {
      console.log(data);

      $.each(data.items, function (i, item) {
        // Snippet
        var title = item.snippet.title;
        var thumb = item.snippet.thumbnails.default.url;
        var country = item.snippet.country;
        var lang = item.snippet.defaultLanguage;
        description = item.snippet.description;
        // Content Details
        playlistsId = item.contentDetails.relatedPlaylists.uploads;
        // Statistics
        var isPrivate = item.statistics.hiddenSubscriberCount;
        var subscriberCount = item.statistics.subscriberCount;
        var videoCount = item.statistics.videoCount;
        var viewCount = item.statistics.viewCount;
        // Topic Details
        var category = item.topicDetails.topicCategories;
        // Display Results
        $("#result tbody").append("<tr><th>대표사진</th><td><img src='" + thumb + "'/></td></tr><tr><th>제목(링크)</th><td><a href='" + url + "'>" + title + "</td></tr> <tr><th>소개말</th><td>" + description + "</td></tr><tr><th>국가 / 언어 </th><td>" + country + " / " + lang + "</td></tr><tr><th>구독자 수</th><td>" + subscriberCount + "</td></tr><tr><th>총 조회수</th><td>" + viewCount + "</td></tr><tr><th>동영상 수</th><td>" + videoCount + "</td></tr><tr><th>주제 카테고리</th><td>" + category + "</td></tr>");
      });

      /* PlaylistItems */
      $.ajax({
        url: "https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=" + playlistsId + "&key=AIzaSyAyvig5VkfPt_lBR4sFl-ajsULtgUHmTwA",
        dataType: "jsonp",
        error: function (err) {
          document.querySelector("#msg").innerHTML = "Error: " + err;
        },
        success: function (data) {
          console.log(data);
          var videoIds = "";
          $.each(data.items, function (i, item) {
            // Content Details
            var date = new Date(item.contentDetails.videoPublishedAt);
            console.log(diffDates(date));
            console.log(diffDates(date) <= diffAllowed);
            if (diffDates(date) <= diffAllowed) {
              videoIds = videoIds + item.contentDetails.videoId + ",";
              recentVideoCount++;
            }
          });
          videoIds = videoIds.substring(0, videoIds.length - 1);
          console.log(videoIds);
          console.log(recentVideoCount);

          /* Videos */
          $.ajax({
            url: "https://www.googleapis.com/youtube/v3/videos?part=statistics%2Csnippet&id=" + videoIds + "&key=AIzaSyAyvig5VkfPt_lBR4sFl-ajsULtgUHmTwA",
            dataType: "jsonp",

            success: function (data) {
              console.log(data);
              var views = [];
              $.each(data.items, function (i, item) {
                // Snippets
                var title = item.snippet.title;
                var thumb = item.snippet.thumbnails.default.url;
                // Statistics
                var likeCount = item.statistics.likeCount;
                var dislikeCount = item.statistics.dislikeCount;
                var viewCount = item.statistics.viewCount;
                var commentCount = item.statistics.commentCount;
                // player.embedHtml
                // Add viewCount to array views
                views.push(parseInt(viewCount));
                // Display Video Info
                $("#videos tbody").append("<tr><td><img src='" + thumb + "'/></td><td>" + title + "</td><td>" + likeCount + "</td><td>" + dislikeCount + "</td><td>" + commentCount + "</td><td>" + viewCount + "</td></tr>");
              });
              // 평균 계산
              var avg = 0;
              for (var i = 0; i < views.length; i++) {
                avg += views[i];
              }
              if (recentVideoCount == 0) {
                avg = "최근 판단할 수 있는 영상 없음";
              } else if (recentVideoCount <= minVideoCount) {
                avg = avg / recentVideoCount;
              } else {
                avg = avg - Math.max(...views) - Math.min(...views);
                avg = avg / (recentVideoCount - 2);
              }
              // Display Average
              $("#result tbody").append("<tr><th class='custom'>평균 조회수<br>최근 50일 이내 절사평균</th><td>" + avg + "</td></tr>");
            }
          });
        }
      });

      /* Extract Email */
      var emails = extractEmail(description).join('\n');
      $("#result tbody").append("<tr><th class='custom'>연락처</th><td>" + emails + "</td></tr>");
    }
  });
}

function extractEmail(text) {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}

function diffDates(dateOne, dateTwo) {
  if (typeof dateTwo === 'undefined') {
    dateTwo = new Date();
  }
  var diffInMilisec = dateTwo.getTime() - dateOne.getTime();
  return Math.ceil(diffInMilisec / (1000 * 60 * 60 * 24));
}
