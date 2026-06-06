

const clientIo = io("http://localhost:3000", {
    auth: {
        token: `bearer ${localStorage.getItem("authorization")}`
    }
});
// const clientIoAdmin = io("http://localhost:3000/admin");


clientIo.emit("hi", { id: localStorage.getItem("socketId") });

clientIo.on("connect_error", (data) => {
    console.log("connect_error", data);
})
// clientIo.on("welcome", (message) => {
//     console.log(message);
// })


// clientIoAdmin.emit("hi", "Hello from the client! Admin here!", (data) => {
//     console.log(data)
// });

// clientIoAdmin.on("welcome", (message) => {
//     console.log(message);
// })