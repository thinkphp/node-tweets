var sys = require("sys"),  
    http = require("http"),  
    url = require("url"),  
    path = require("path"),  
    fs = require("fs"),  
    events = require("events"); 

function load_static(uri, response) {

    var filename = path.join(process.cwd(), uri); 

    fs.exists(filename, function(exists) {  

        if(!exists) {  
            response.writeHead(404, {"Content-Type": "text/plain"});  
            response.write("404 Not Found\n");  
            response.end();  
            return;  
        }  
          
        fs.readFile(filename, "binary", function(err, file) {  
            if(err) {  
                response.writeHead(500, {"Content-Type": "text/plain"});  
                response.write(err + "\n");  
                response.end();  
                return;  
            }  
              
            response.writeHead(200);  
            response.write(file, "binary");  
            response.end();  
        });  
    });  
};


var tweet_emitter = new events.EventEmitter();

function get_tweets() {

    var options = {
        hostname: "api.twitter.com",
        path: "/1/statuses/user_timeline/thinkphp.json?count=10",
        method: "GET"
    };

    var options2 = {
        hostname: "search.twitter.com",
        path: "/search.json?q=mootools",
        method: "GET"
    };

    var req = http.request(options, function( response ){      
                                   
               response.setEncoding('binary');

               var out = ''  

               response.on("data", function( data ) {

                        out += data 
               }) 
               response.on("end", function(){

                        var tweets = out

                        if( tweets.length > 0) {

                            tweet_emitter.emit("tweets", tweets) 
                        } 
               })
    })     

    req.on('error', function(e) {

            console.log('problem with request: ' + e.message);
    });
	
    req.end();
};

setInterval(get_tweets, 5000);

http.createServer(function(request, response){

     var uri = url.parse(request.url).pathname; 

     if(uri == '/stream') {

        var listener = tweet_emitter.addListener("tweets", function( tweets ){

            response.writeHead("Access-Control-Allow-Origin", "*")
            response.writeHead(200, { "Content-Type" : "text/plain" })
            response.write( JSON.stringify( tweets ) )
            response.end() 

            clearTimeout( timeout )
        })

        var timeout = setTimeout(function(){

            response.writeHead("Access-Control-Allow-Origin", "*")
            response.writeHead(200, { "Content-Type" : "text/plain" })
            response.write( JSON.stringify([]) )
            response.end() 

            tweet_emitter.removeListener( listener )

        },10000) 

     } else {

        load_static(uri, response)
     }

}).listen(8080);

sys.puts("Server running at http://localhost:8080")