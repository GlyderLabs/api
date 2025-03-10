import app from "./app";
//import { Scheduler } from "./automation/Scheduler";

const PORT = parseInt(process.env.PORT || '5000') || 5000;

app.listen(PORT, '0.0.0.0', () =>{
    //Scheduler.getInstance()
    console.log(`Server running on port ${PORT}`)
} );