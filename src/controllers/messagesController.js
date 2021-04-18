let getMessagePage = (req, res) => {
    return res.render("messages.ejs");
};

export const mcontroller = {
    getMessagepage: getMessagePage
};