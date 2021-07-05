//error hanndling

const sum = (a,b) => {
    if (a && b) {
        return a + b
    }
    throw new Error('Invalid arguements')

}

// console.log(sum(1));

//for codes that is synchrounous, you dont send request or interact with files. you can use a try, catch block.
try {
    console.log(sum(1))
} catch (error) {
    console.log('error occured');
    console.log(error);
}; //allows code to continue even if errors occurs. prevents crashing and informs if something bad happens in the application.

//when working with promises i.e asynchronous code you can use then, catch. 

console.log('this works')