require('dotenv').config()
const express=require("express")
const mongoose=require("mongoose")
const cors=require("cors")
const path=require("path")

const app = express()
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())
const corsOptions = {
    origin: 'http://localhost:3000', // Update with your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  };
  
  app.use(cors(corsOptions));

mongoose.connect('mongodb://0.0.0.0:27017/reminderAappDB',{
    // useNewUrlParser: true, 
    // useUnifiedTopology: true
}).then(
    ()=>{console.log("connected")}
)
.catch((err)=>{
    console.log(err)
})
const reminderSchema = new mongoose.Schema({
    reminderMsg: String,
    remindAt: String,
    isReminded: Boolean
})
const Reminder = new mongoose.model("reminder", reminderSchema)

const accountSid =process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

//Whatsapp reminding functionality

setInterval(() => {
    Reminder.find({})
      .exec()
      .then(reminderList => {
        if (reminderList) {
          reminderList.forEach(reminder => {
            if (!reminder.isReminded) {
              const now = new Date();
              if ((new Date(reminder.remindAt) - now) < 0) {
                Reminder.findByIdAndUpdate(reminder._id, { isReminded: true })
                  .exec()
                  .then(remindObj => {
                    client.messages.create({
                      body: reminder.reminderMsg,
                      from: 'whatsapp:+14155238886',
                      to: 'whatsapp: +916263972688'
                    })
                      .then(message => {
                       // console.log(message.sid);
                      })
                      .catch(error => {
                        console.error(error);
                      })
                      .finally(() => {
                        // Any finalization steps can be added here
                      });
                  })
                  .catch(err => {
                    console.log(err);
                  });
              }
            }
          });
        }
      })
      .catch(err => {
        console.log(err);
      });
  }, 1000);


//API routes
app.get("/getAllReminder", async (req, res) => {
    try {
      const reminderList = await Reminder.find({});
      res.send(reminderList);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });


app.post("/addReminder", async (req, res) => {
    const { reminderMsg, remindAt, reminderPhone } = req.body;
    const reminder = new Reminder({
      reminderMsg,
      remindAt,
      isReminded: false,
    });
  
    try {
      await reminder.save();
      const reminderList = await Reminder.find({});
      res.send(reminderList);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });



app.post("/deleteReminder", async (req, res) => {
    try {
      await Reminder.deleteOne({ _id: req.body.id });
      const reminderList = await Reminder.find({});
      res.send(reminderList);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });


app.listen(9000, () => console.log("Be started"))