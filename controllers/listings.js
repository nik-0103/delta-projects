const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");


// Get Coordinates from Location
async function getCoordinates(location) {

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
        {
            headers: {
                "User-Agent": "WanderLust-Major-Project",
            },
        }
    );

    const data = await response.json();

    if (!data.length) {
        throw new ExpressError(400, "Location not found!");
    }

    return [
        Number(data[0].lon),
        Number(data[0].lat),
    ];
}

// Index route
module.exports.index = async (req, res) => {

    const { search } = req.query;

    let allListings;

    if (search && search.trim() !== "") {

        allListings = await Listing.find({
            $or: [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    location: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    country: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ]
        });

    } else {

        allListings = await Listing.find({});

    }

    res.render("listings/index.ejs", {
        allListings,
        search
    });
};


// New Form
module.exports.renderNewForm = (req, res) => {

    res.render("listings/new.ejs");

};


// Show Route
module.exports.showListing = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {

        req.flash(
            "error",
            "Listing you requested for does not exist!"
        );

        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};


// Create Route
module.exports.createListing = async (req, res) => {

    const url = req.file.path;
    const filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    newListing.image = {
        url,
        filename
    };


    // Get coordinates from location
    const coordinates = await getCoordinates(
        req.body.listing.location
    );


    // Save geometry
    newListing.geometry = {
        type: "Point",
        coordinates: coordinates,
    };


    await newListing.save();

    req.flash(
        "success",
        "New Listing Created!"
    );

    res.redirect("/listings");
};


// Edit Form
module.exports.renderEditForm = async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {

        req.flash(
            "error",
            "Listing you requested for does not exist!"
        );

        return res.redirect("/listings");
    }


    let originalImageUrl = listing.image.url;

    originalImageUrl = originalImageUrl.replace(
        "/upload",
        "/upload/h_300,w_250"
    );


    res.render("listings/edit.ejs", {
        listing,
        originalImageUrl
    });
};


// Update Route
module.exports.updateListing = async (req, res) => {

    let { id } = req.params;


    let listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { returnDocument: "after" }
    );


    // Update Location Coordinates
    if (req.body.listing.location) {

        const coordinates = await getCoordinates(
            req.body.listing.location
        );

        listing.geometry = {
            type: "Point",
            coordinates: coordinates,
        };
    }


    // Update Image
    if (req.file) {

        let url = req.file.path;
        let filename = req.file.filename;

        listing.image = {
            url,
            filename
        };
    }


    await listing.save();


    req.flash(
        "success",
        "Listing Updated!"
    );

    res.redirect(`/listings/${id}`);
};


// Delete Route
module.exports.destroyListing = async (req, res) => {

    let { id } = req.params;

    let deletedListing = await Listing.findByIdAndDelete(id);

    console.log(deletedListing);

    req.flash(
        "success",
        "Listing Deleted!"
    );

    res.redirect("/listings");
};