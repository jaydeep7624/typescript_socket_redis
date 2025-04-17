import { createClient, RedisClientType } from 'redis';  

let client: RedisClientType | null = null;

const initRedisClient = async() =>{
    if(!client){
        client = createClient({
            socket: {
                host: "127.0.0.1",
                port: 6379
            }
        });
        client.on("error",()=>console.log("Error in creating client"));
    }
    try{
        /*
        await client.connect();
        console.log("Redis is connected");
       const lastSaveUnix :any = await client?.lastSave();
        const lastSaveDate = new Date(lastSaveUnix * 1000);
        
        console.log(`🕒 Last successful save: ${lastSaveDate.toISOString()}`);


        await client.lPush('mylist',['a','b','c']);
        console.log("Poped Item:",await client.lPop('mylist'));

        let list_item1:string[]=await client.lRange('mylist',0,-1); // Retrive all the list of item
        console.log(list_item1);
        await client.del('mylist'); // delete  any list 


        console.log("list length",await client.lLen('mylist')); // it return length of list 
        
        let list_item2:string[]=await client.lRange('mylist',0,-1);
        console.log(list_item2);
        console.log(await client.lIndex('mylist',1)); // it return specific value at index
        
        
        
        await client.lInsert("mylist",'AFTER','b','d'); // insert d after b 
        console.log(await client.lRange('mylist',0,-1)); 


        await client.lPush('fruit',['apple','orange','banana']);
        console.log("lposh command : ",await client.lPos('fruit','apple')) // it return position of item 


        await client.lMove('fruit','fruit1',"LEFT","RIGHT"); // Move 1 element from fruit to fruit1 from left to right 
        console.log("Moving the element : ",await client.lRange('fruit',0,-1))
        console.log("Moving the element : ",await client.lRange('fruit1',0,-1))
        await client.rPush('list1', ['one', 'two']);
        // await client.rPush('list2', []);
        
        const result = await client.sendCommand([
          'LMPOP',
          '2',
          'list2',
          'list1',
          'LEFT',
          'COUNT',
          '3'
        ]); // it pop item first list2 if  empty then remove from list1 from the left 
        
        
        await client.lPush("pushx_list",['banana',"apple"]);
        console.log("Push X list Item : ",await client.lPushX("pushx_list",'apple')); // if list exist then push if not then not push 
        await client.del('lrem_list');


        await client.lPush("lrem_list",["apple","banana",'orange','apple','orange','apple']);
        console.log(await client.lRem('lrem_list',-1,'apple')); // Remove APPle from the left side only one 
        console.log(await client.lRem('lrem_list',1,'apple')); // Remove Apple from right side only one  
        console.log(await client.lRem('lrem_list',0,'apple'));  // Remove All the Apple from given list 
        console.log("Lrem Item",await client.lRange("lrem_list",0,-1));


        await client.del('lset_item');
        await client.lPush('lset_item',['apple','orenage','banana']);
        await client.lSet('lset_item',1,'grapes'); // add grapes in 1 index 
        console.log('lset_item',await client.lRange('lset_item',0,-1));

        await client.lPush('ltrim_item',['1',"2","3","4","5","6"]);
        console.log("Trim Item",await client.lTrim('ltrim_item',1,3)); // Get value from 1 to 3 index 
        console.log(await client.lRange('ltrim_item',0,-1));


        /* Sorted Sets Method :  */
        // To Add Players in Sroted Sets : 
        /*
        await client.zAdd("players",[
            {score:100,value:'Jay'},
            {score:120,value:'Deep'},
            {score:210,value:'Jaydeep'},
            {score:140,value:'Alice'},
            {score:190,value:'Bob'},
        ])
        console.log("remove element ",await client.zRem('players','Jay')) // Remove Element from the sorted sets 
         // To Retrive Playes In Asending Order By Default : 
        console.log(await client.zRange('players', 0, -1 ));

        // Lexicographical order
        console.log(await client.zLexCount('players','[Alice','[Deep')); // COunt The member between Lexically 
        console.log("lexical count ",await client.zLexCount('players','[Deep','[Alice'));

        console.log("Zcard : ",await client.zCard('players')); // its return total no. of length 

        console.log("ZCount  count with specific Value : " ,await client.zCount('players',120,200)) // Count  Number  in between 

        const result1 = await client.zRangeWithScores('players', 0, -1 );
        console.log("Players with Scores:", result1);
        
        console.log("Range With Scores : ",await client.zRangeWithScores('players', 1, 3));

        console.log("Rank OF THe Players : ",await client.zRank('players','Alice')) ; // It return Rank -> index in sorted sets 


   
         // Hashes  : store  As A Object 

        await client.hSet('User1001','name','jaydeep');
        await client.hSet('User1001','email','jaydeep@gmail.com');
        console.log("get the value from Hashes : ",await client.hGet('User1001','email'));    // get Only Email Of Perticular Object     
        console.log("get the All key value  value from Hashes : ",await client.hGetAll('User1001'));    // Retrive All The Key value from the object 
        console.log("get all the value using hVals :",await client.hVals("User1001")); // Retrive Only Value 
        console.log("get all the Keys using hKeys :",await client.hKeys("User1001")); // Retrive Only Keys 
        console.log("Get Number of Field in Hash  : ",await client.hLen("User1001")); // Find No of fireld  in hash 
        console.log("Delete Any Filed in Hash Object :",await client.hDel('User1001','age')); // Delete Any Field from hash Object 
        console.log("Aftre Delete Get ALl Field :",await client.hGetAll('User1001'));
        console.log("Give Redis Information : ",await client.hello()); // Handshake it redis 
        console.log("Check Emial is Exist In Object : ",await client.hExists('User1001',"email")) // To Check Email is Exist in the Object 
        await client.hSet("User1001",'name','jaydeep');
        await client.hIncrBy("User1001",'age',1); // It Increment the value of that key if not then 0 consider 
        await client.hIncrByFloat("User1001",'age',11.2); // Increment the float point value  you give 
        console.log("Aftre Delete Get ALl Field :",await client.hGetAll('User1001'));
        console.log("Get Multiple Value From Obejct : ",await client.hmGet('User1001',['name','age','email'])); // It Return Multiple Value of that perticular Object 
        console.log("It Return Length Of The Value : ",await client.hStrLen('User1001','name')) // It Return Length Of Value 

        // console.log(await client.hGetDel('User1001', 'name')); Not Support in the RedisClient 


        // SETS : Add  unique Value Only not in same order it store 
        await client.del('fruits');
        await client.sAdd('fruits',['apple', 'banana','prange']);
        console.log("Members of the Sets : ",await client.sMembers('fruits'));  // To Retrive All the memebrs 

        await client.sRem('fruits','apple'); // Remove Apple From The Sets 
        console.log("After Apple  Remove . Members of the Sets : ",await client.sMembers('fruits')); 
        console.log(await client.sMembers('fruits')) 

        console.log("To check Apple is Member of Fruits : ",await client.sIsMember('fruits','banana')); // Banana IS Memeber of Fruits 

        await client.sAdd('fruits1',['apple','orange','banana'])
        await client.sAdd('fruits2',['apple','grapes'])
        console.log("Find The difference of two sets ",await client.sDiff(['fruits1','fruits2'])) // Differen From Fruits 1 to Fruits 2

        console.log("Intersection of two sets :",await client.sInter(['fruits1','fruits2'])) // To Intersection between Fruits 1 to Fruits 2
        console.log("Union of two sets",await client.sUnion(['fruits1','fruits2'])) // To Take Union Between Fruits1 To Fruits 2

        console.log(await client.flushAll()); // Delete All Keys 
*/
        
    }
    catch(error){  
        console.log("Error occur while intializing redis ");
        throw error;
    } 
} 
const getClient = (): RedisClientType | null => client;
export{initRedisClient,getClient};



