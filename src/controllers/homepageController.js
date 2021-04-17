let getHomePage = (req, res) => {
    return res.render("homepage.ejs");
};

export const hpcontroller = {
    getHomepage: getHomePage
}