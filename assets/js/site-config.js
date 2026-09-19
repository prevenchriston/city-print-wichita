/* City Print — editable site settings.
   Non-developers: this is the only file you need to touch for reviews and the form. */
window.CITYPRINT = {
  /* Quote form delivery.
     Leave "" to open the visitor's email app addressed to sales@cityprintusa.com.
     For a real inbox-delivered form, create a free form at formspree.io (or similar)
     and paste its endpoint here, e.g. "https://formspree.io/f/xxxxxxx". */
  formEndpoint: "",
  formEmail: "sales@cityprintusa.com",

  /* Customer reviews.
     Paste REAL reviews only (e.g. from the Google Business Profile). The reviews
     section stays hidden until at least one entry exists. Example entry:
       { name: "Jane D.", source: "Google", rating: 5, text: "Exact words of the review." }
  */
  reviews: [],

  /* Optional: link to the Google reviews page, shown under the reviews. */
  reviewsUrl: ""
};
