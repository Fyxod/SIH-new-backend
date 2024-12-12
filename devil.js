// import mongoose from 'mongoose';

// async function connectMongo(db){
//     try {
//         if(db == 'test'){
//         console.log('connecting to test db');
//         await mongoose.connect();
//         console.log('MongoDB connected');
//         }
//         else{
//             console.log(`connecting to ${db}`);
//             await mongoose.connect(`mongodb+srv://khushichoudhary1107:Khushi123@cluster0.n31bj.mongodb.net/${db}`);
//             console.log('MongoDB connected');
//         }
//         console.log('MongoDB connected');
//     } catch (error) {
//         console.error(error);
//     }
// }

// async function purgeData() {
//     await connectMongo('test');

//     try {
//         await mongoose.connection.db.dropDatabase();
//         console.log('Database purged');
//     } catch (error) {
//         console.error('Error purging database:', error);
//     }

//     await mongoose.connection.close();

//     await connectMongo('candidate_database');

//     try {
//         await mongoose.connection.db.dropDatabase();
//         console.log('Database purged');
//     } catch (error) {
//         console.error('Error purging database:', error);
//     }
    
//     await mongoose.connection.close();
//     await connectMongo('expert_database');
//     try {
//         await mongoose.connection.db.dropDatabase();
//         console.log('Database purged');
//     } catch (error) {
//         console.error('Error purging database:', error);
//     }
    
//     mongoose.connection.close();
// }

// purgeData();