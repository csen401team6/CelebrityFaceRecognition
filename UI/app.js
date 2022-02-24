Dropzone.autoDiscover = false;


// The init function is called once the page is loaded
function init() {
  /**
   * This initializes the dropzone (the area we drag the images to).
   * url: The url dropzone posts to
   * 
   * maxfiles: Can be used to limit the maximum number of files that will 
   * be handled by this Dropzone.
   * 
   * addRemoveLinks:If true, this will add a link to every file 
   * preview to remove or cancel (if already uploading) the file.
   * 
   * dictDefaultMessage: The text used before any files are dropped.
   * 
   * autoProcessQueue: If false, files will be added to the queue but the queue 
   * will not be processed automatically. 
   */ 
    let dz = new Dropzone("#dropzone", {
        url: "/",
        maxFiles: 1,
        addRemoveLinks: true,
        dictDefaultMessage: "Some Message",
        autoProcessQueue: false
    });

    /**
     * If we add a file, we check if it is the second one in the dropzone.
     * If it is, we remove the first.
     */
    dz.on("addedfile", function() {
        if (dz.files[1]!=null) {
            dz.removeFile(dz.files[0]);        
        }
    });

    // when an images is uploaded
    dz.on("complete", function (file) {
        // get the url of the uploaded image 
        let imageData = file.dataURL;

        // get the url to the classify_image API endpoint
        var url = "/api/classify_image";

        // jQuery post http call
        /**
         * $.post(URL,data,callback);
         * 
         * The required URL parameter specifies the URL you wish to request.
         * (classify image)
         * 
         * The optional data parameter specifies some data to send along with the request.
         * (the image)
         *
         * The optional callback parameter is the name of a function to be executed if the request succeeds.
         * (get the output and display it)
         */
        $.post(url, {
            image_data: file.dataURL
        },function(data, status) {
            /* 
            Below is a sample response if you have two faces in an image lets say messi and roger together.
            Most of the time if there is one person in the image you will get only one element in below array
            data = [
                {
                    class: "lionel_messi",
                    class_probability: [1.05, 12.67, 22.00, 4.5, 91.56],
                    class_dictionary: {
                        maria_sharapova: 0,
                        serena_williams: 1,
                        roger_federer: 2,
                        virat_kohli: 3,
                        lionel_messi: 4
                    }
                },
                {
                    class: "roder_federer",
                    class_probability: [7.02, 23.7, 52.00, 6.1, 1.62],
                    class_dictionary: {
                        maria_sharapova: 0,
                        serena_williams: 1,
                        roger_federer: 2,
                        virat_kohli: 3,
                        lionel_messi: 4
                    }
                }
            ]
            */
            // print the response in the console
            console.log(data);

            // if no faces detected, do not show any results
            if (!data || data.length==0) {
                $("#resultHolder").hide();
                $("#divClassTable").hide(); 
                // display an error message               
                $("#error").show();
                return;
            }
            // define a list of possible classes
            let players = ["maria_sharapova", "serena_williams", "roger_federer", "virat_kohli", "lionel_messi"];
            
            let match = null;
            let bestScore = -1;
            // search for the class having the best matching face inside the image
            for (let i = 0; i < data.length; ++i) {
                // in this face find the highest match
                let maxScoreForThisClass = Math.max(...data[i].class_probability);

                // if this match is better than the previous face
                if(maxScoreForThisClass>bestScore) {
                    // make it the new match
                    match = data[i];
                    bestScore = maxScoreForThisClass;
                }
            }
            // if there is a match
            if (match) {
                // hide errors
                $("#error").hide();
                
                // show results
                $("#resultHolder").show();
                $("#divClassTable").show();

                // provide the html page with the class of the best match
                $("#resultHolder").html($(`[data-player="${match.class}"`).html());
                let classDictionary = match.class_dictionary;

                // fill the matching info for each class
                for(let personName in classDictionary) {
                    let index = classDictionary[personName];
                    let proabilityScore = match.class_probability[index];
                    let elementName = "#score_" + personName;
                    $(elementName).html(proabilityScore);
                }
            }
        });
    });

    // start classifying when we submit the image 
    // (clicking the classify button)
    $("#submitBtn").on('click', function (e) {
        dz.processQueue();		
    });
}

// when the document loads
$(document).ready(function() {
    console.log( "ready!" );
    // hide errors and results
    $("#error").hide();
    $("#resultHolder").hide();
    $("#divClassTable").hide();

    // call the init function
    init();
});