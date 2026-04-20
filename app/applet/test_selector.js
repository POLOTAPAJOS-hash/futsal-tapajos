const { JSDOM } = require("jsdom");

fetch("http://localhost:3000")
  .then(res => res.text())
  .then(html => {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Test the selector
    const sel1 = "div:nth-of-type(2) > div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > input:nth-of-type(1)";
    const node1 = document.querySelector(sel1);
    
    console.log("Found matches:");
    
    if (node1) {
        console.log("Selector 1 matches:", node1.outerHTML);
        
        let path = [];
        let curr = node1;
        while(curr && curr.tagName) {
            path.push(curr.tagName + (curr.className ? "." + curr.className.split(" ").join(".") : ""));
            curr = curr.parentNode;
        }
        console.log("Path:", path.reverse().join(" > "));
    } else {
        console.log("Selector 1 NOT FOUND");
    }
  });
