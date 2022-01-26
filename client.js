class Client {
    constructor(index, host, port) {
        this.index = index;
        this.host = host;
        this.port = port;
    }
}

//console.log("DocSharing Client starting...");

/***************************************************VARS************************************ */
var net = require('net')
var fs = require('fs');

END_OF_MESSAGE = "||"


//Client fields
myIndex=0;
myPort=0;
startString = ""
myString="";
myTS=0;//timestamps

finished = false

otherClients = []; 
sockets = [] 

operations = []

currOp = 0;//current operation the client is working on

updates = [] //<timestamp index ** operation>
updates_str = [] 

goodbye_count = 0;

currentMessage = ""
msg_list = []

updateMessages = []

countOp=0
k=1 //number of local updates before sending update messages

const server = new net.Server();

const myArgs = process.argv.slice(2);

last_ts = []
/***************************************************FUNCTIONS************************************ */

/**
 * 
 * 
 */

 function compare(client, otherClient){
    if(client.index < otherClient.index)
        return -1;
    if(client.index > otherClient.index)
        return 1;
    return 0;
}

/**
 * split recieved data into messages
 * 
 */
function getData(data){
    //console.log('Data received from client: '+data);
   
    if(data.length==0)
        return;
    messages = data.split(END_OF_MESSAGE) // '|' - end of message
    if(messages.length==1){
       currentMessage+=messages[0]  
    }
    else{
        if((data.charAt(data.length-1)=="|")&&(data.charAt(data.length-2)=="|")){
            currentMessage+=messages[0];
            msg_list.push(currentMessage);
            currentMessage = ""
            for(let i = 1; i< messages.length-1;i++){
                if(messages[i].charAt(0)=="|"){
                    if(i==1)
                        msg_list[0] = msg_list[0] + "|"
                    else
                        msg_list[i-1]=msg_list[i-1] + "|"
                    messages[i]=messages[i].slice(1)
                    
                }
                msg_list.push(messages[i])
            }
        }
        else{
            currentMessage+=messages[0];
            msg_list.push(currentMessage);
            for(let i = 1; i< messages.length-1;i++){
                if(messages[i].charAt(0)=="|"){
                    if(i==1)
                        msg_list[0] = msg_list[0] + "|"
                    else
                        msg_list[i-1]=msg_list[i-1] + "|"
                    messages[i]=messages[i].slice(1)
                    
                }
                msg_list.push(messages[i])
            }
            currentMessage = messages[messages.length-1]
        }
    }

    for(let i=0;i<msg_list.length;i++){
         getMessage(msg_list[i])
    }
    msg_list = []

}


 function createServer(port){
    server.listen(port, function() {
        //console.log("Server listening for connection requests on socket localhost:"+port);
    });

    server.on('connection', function(socket) {
       // console.log('A new connection has been established.');
        sockets.push(socket) 
        if(sockets.length==otherClients.length){
            start();
        }
     
        socket.on('data', function(chunk) {
            data = chunk.toString().replace('\r','')
            getData(data)
        });

        socket.on('end', function() {
            //console.log('Closing connection with the client');
        });

        socket.on('close', function () {
           // sockets.splice(sockets.indexOf(socket), 1);
        });

        socket.on('error', function(err) {
            console.log(`Error: ${err}`);
        });

        
    }); 
}

 function createClientSocket(port,host){
    const client = new net.Socket();
    client.connect({ port: port, host: host }, function() {
        //console.log("TCP connection established with the server.");
        sockets.push(client)
        if(sockets.length==otherClients.length){
            start();
        }

    });

    client.on('data', function(chunk) {
        //console.log(`Data received from the server: ${chunk.toString()}.`);
    
        data = chunk.toString().replace('\r','')
        getData(data)
    });

    client.on('end', function() {
        //console.log('Requested an end to the TCP connection');
    });

    client.on('error',function(err)  {
        if(err.message.indexOf('ECONNREFUSED') > -1) {
            //recconect
            setTimeout(()=>{
                createClientSocket(port,host)
            },1000)
        }
    })
}

function start(){
    /*for(let i = 0;i<operations.length;i++){
        setTimeout(event,1000);    
    }*/
   // for(let i = 0;i<operations.length;i++){
        setTimeout(event,1000);    
    //}
}

function end(){
    for(let i = 0; i<sockets.length;i++)
            sockets[i].destroy()//.end()
        
    server.close();
    
    console.log("Client "+myIndex+" is exiting. String = "+myString)
    /*console.log("--------------------------------------------------------")
    for(let i=0;i<updates.length;i++)
        console.log(updates[i])*/
}

function doOp(oper){
    op_ = oper.split(" ")
    if (op_[0]=="insert"){
        if(oper.length<10){
            myString=myString+oper.charAt(7)
           
        }
        else
            myString = [myString.slice(0,parseInt(oper.charAt(9))),oper.charAt(7),myString.slice(parseInt(oper.charAt(9)),myString.length)].join("")
    }
    else if(op_[0]=="delete"){
        myString = [myString.slice(0,parseInt(oper.charAt(7))),myString.slice(parseInt(oper.charAt(7))+1,myString.length)].join("")
    }
    
}


function sendUpdates(){
    for(let i=0;i<sockets.length;i++)
        for(let j=0;j<updateMessages.length;j++)
            sockets[i].write(updateMessages[j]+END_OF_MESSAGE)
    countOp=0;
    updateMessages=[]
}



/**
 * event to process an operation on the string
 * After an operation sends update message to all other clients
 *      with current timestamp, myIndex, MyString, and operation 
 */
 function event(){
    //timestamp
    myTS = myTS + 1

    op = operations[currOp]//.replace('\r\n','')

    doOp(op)

    message = myTS + " "+myIndex + "**" + op
    updateMessages.push(message+" ")
    updates.push(myTS +" "+ myIndex  + "**" + op)
    updates_str.push(myString)
    
   
    countOp++
    if(countOp==k)
        sendUpdates()
    currOp = currOp + 1;
    if(currOp==operations.length){
        if(countOp!=k)
            sendUpdates()
        console.log("Client "+myIndex+" finished his local string modifications")
    
        finished = true;
        for(let i=0;i<sockets.length;i++)
            sockets[i].write("Goodbye!"+END_OF_MESSAGE)
        if(goodbye_count==otherClients.length)
            end()
    }
    else
        setTimeout(event,100);
}


function removeOldUpdates(){
    ts = parseInt(updates[0].split(" ")[0])
    id = parseInt(updates[0].split(" ")[1])
    while(true){
        fl = true
        for(let i=0;i<last_ts.length;i++){
            if(i!=(myIndex-1) && ts>=last_ts[i])
                fl=false
        }
        if(fl){
            op = updates[0].split("**")[1]
            console.log("-----Client "+myIndex+" removed operation <"+op+", "+ts+"."+id+"> from storage")
            updates.shift()
            updates_str.shift()
            if(updates.length>0){
                ts = parseInt(updates[0].split(" ")[0])
                id = parseInt(updates[0].split(" ")[1])
            }
            else
                break;
        }
        else
            break;
    }
}

/**
 * 
 * 
 */

 function start_merging(op,otherTS,otherIndex){
    console.log("Client "+myIndex+" started merging, from "+otherTS+"."+otherIndex+" time stamp, on "+myString)
   
    doOp(op)
    updates.push(otherTS+" "+otherIndex +"**"+op)
    updates_str.push(myString)
    console.log("   operation <"+op+", "+otherTS+"."+otherIndex+">, string: "+myString)
    for(let j = stack_updates.length-1;j>=0;j--){
        ts = stack_updates[j].split(" ")[0]
        ind = stack_updates[j].split(" ")[1].split("**")[0]
        op_other = stack_updates[j].split("**")[1]
        doOp(op_other)
        updates.push(ts + " " + ind + "**"+op_other)
        updates_str.push(myString)
        console.log("   operation <"+op_other+", "+ts+"."+ind+">, string: "+myString)
    }
    console.log("Client "+myIndex+" ended merging with string "+myString+", on timestamp "+myTS+"."+myIndex)
    
 }

 function merge(otherTS, otherIndex, op){
    
    stack_updates = []
    i_st = 0;
    for(let i=updates.length-1;i>=0;i--){
        ts = parseInt(updates[i].split(" ")[0])
        id = parseInt(updates[i].split(" ")[1].split("**")[0])
        //right place for the new operation
        if(otherTS>ts || (otherTS==ts && otherIndex>id)){
           //console.log("merging: other_ts: "+otherTS+" ts: "+ts+" otherIndex: "+otherIndex+" id: "+id)
            str = updates_str[i]
            myString = str;
            //logger
            start_merging(op,otherTS,otherIndex)
            return;
        }
        else{
            //console.log("NOT merging: other_ts: "+otherTS+" ts: "+ts+" otherIndex: "+otherIndex+" id: "+id)
           
            stack_updates.push(updates[i])
            updates.pop()
            updates_str.pop()
        }
    }
    //if timestam is smaller than all current updates, start from the begining
    myString = startString;

    start_merging(op,otherTS,otherIndex)        
}

/**
 * 
 * 
 */

 function getMessage(message){
    if(message=="Goodbye!"){
        goodbye_count = goodbye_count + 1;
        if(finished && (goodbye_count == otherClients.length))
            end();
        return;
    }
    //console.log("       MESSAGE: "+message)
    //timestamp
    otherTS = message.split(" ")[0]
    myTS = Math.max(myTS,otherTS)
    myTS = myTS + 1

    otherId = message.split(" ")[1].split("**")[0]
    otherOp = message.split("**")[1]

    //logger
    console.log("Client "+myIndex+" received an update operation "+"<"+otherOp+", "+otherTS+"> from client " + otherId )
    last_ts[otherId-1] = otherTS
    merge(otherTS,otherId,otherOp)

    removeOldUpdates()
}

function createSockets(){
    if(myIndex!=1){
        createServer(myPort)
        
    }
    for(let i = 0;i<otherClients.length;i++){
        if(otherClients[i].index>myIndex){
            createClientSocket(otherClients[i].port,otherClients[i].host);
        }
    }
    
}

//************************************************MAIN CODE*************************************** */

fs.readFile(myArgs[0], (err,data) => {
    var lines = data.toString().split("\n");
    myIndex = parseInt(lines[0]);
    myPort = lines[1];
    myString = lines[2].toString().replace('\r','')
    startString = myString

    //read clients
    var i = 0;
    for(i = 4;i<lines.length;i++){
        
        var splits = lines[i].split(" ");
        if(splits[1]==undefined)
            break;
        var id = splits[0]
        var host = splits[1]
        var port = splits[2]
        otherClients.push(new Client(id,host,port))
        last_ts.push(0)
     
    }
    last_ts.push(0)//not in use, just to do it easy

    otherClients.sort(compare)
    
    i++;
    while(i<lines.length){
        if(lines[i].split(" ")[1]==undefined)
            break
        operations.push(lines[i].replace('\r',''))
        i++;
    }

    createSockets();
   
})

//node client.js input


