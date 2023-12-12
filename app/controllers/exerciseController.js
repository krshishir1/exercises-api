const sayHello = async (req, res) => {
    res.json({message: "Hello Folks"})
}

module.exports = {
    sayHello,
}