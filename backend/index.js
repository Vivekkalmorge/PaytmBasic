
// const express = require('express');
// const cors = require("cors");
// const rootRouter = require("./routes/index");

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use("/api/v1", rootRouter);

// app.listen(3000);


const express = require('express');
const cors = require("cors");
const rootRouter = require("./routes/index");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1", rootRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
