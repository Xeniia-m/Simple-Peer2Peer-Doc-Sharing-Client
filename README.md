# Simple-Peer2Peer-Doc-Sharing-Client

The client
  The client program is initialized with a unique id, a port number, a replica of the shared string (same 
  for all clients), and a list of the clients in the system (defined by their id, host and port), and a list of 
  string operations.
  The client should first connect to the clients, according to the following scheme:
    • The client connects via socket to clients with greater id.
    • The client generates an http server (as shown in class, here at page 88) in order to accept 
    connections from clients with lower id (if exists).
    • Each of these sockets should be defined with a callback function for handling received data.
      The callback for this application should:
        o Update the client  time-stamp 
        o Apply the merge algorithm according to the received update operation.
    • The client set its initial  time-stamp
    • From this point on the client run the following loop
      o For each operation
          ▪ Add a task to the event loop, which:
          • Apply one string modification, as defined in the unput file
          • Send the update to all clients
          ▪ Wait some time
          • When all given local string modifications are done, the client sends a special ‘goodbye’ 
          message to all clients.
          • When ‘goodbye’ messages are received from all other clients, the client prints its replica and 
          exit.
          
The merge algorithm

    • After applying an update (including the client’s own operations), the client should store the 
    operation with its timestamp and the updated string.
    • Whenever the client receives an update operation: in case the timestamp of the operation is 
    smaller than the last updated operation, it should re-apply the updated operations which 
    are greater than the given new updated operation, on the string of that earlier point.
    • In case the earlier stored updated operation is followed by updated operations of all clients 
    with greater timestamps, it can/should be cleaned from the list of stored updated 
    operations.


Input
    The input file of each client is composed of:
    <client id>
    <client port>
    <initial string (same for all clients)>
    \n
    <other client id> <other client host> <other client port>
    …
    \n
    <updated-operation>
    …
Where <updated-operation> is defined by type (‘insert’ or ‘delete’) and index (‘insert’ without index 
denote character adding)
