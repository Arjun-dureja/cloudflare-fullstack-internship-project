addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request))
})

//HTMLRewriter class to change the text of an HTML element
class textChanger
{
	constructor(txt) {
		this.txt = txt
	}
	text(text)
	{
		if (text.lastInTextNode) {
			text.replace(this.txt);
		}
		else {
			text.remove();
		}
	}
}

//HTMLRewriter class to change the href URL of an HTML element
class urlChanger
{
	constructor(url) {
		this.url = url
	}
	element(element)
	{
		element.setAttribute('href', this.url)
	}
}

/**
 * Respond with a random variant
 * @param {Request} request
 */
async function handleRequest(request) {
	//Get cookies
	let cookies = request.headers.get('Cookie')

	const rewriter = new HTMLRewriter()

	//Rewrite HTML Title and URL
	rewriter.on('title', new textChanger("Animal Picker"))
	rewriter.on('a#url', new textChanger("View Image"))

	//Fetch variants and parse as JSON
	const { variants } = await fetch('https://cfw-takehome.developers.workers.dev/api/variants')
		.then((res) => res.json()
	)

	let numVariant = 0

	//Check if cookies exist, if they do, assign the variant
	if(cookies && cookies.includes(`num`)) {
		const i = cookies.indexOf('num=');
		numVariant = parseInt(cookies.substring(i+4,i+5))
	}
	else {
		numVariant = Math.floor(Math.random() * 2)
	}

	let animal, animalURL = ""

	//Assign the user an animal based on the variant they receieve
	if (numVariant == 0) {
		animal = "Dog"
		animalURL = "https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/12234558/Chinook-On-White-03.jpg"
	}
	else {
		animal = "Cat"
		animalURL = "https://www.rd.com/wp-content/uploads/2019/05/American-shorthair-cat.jpg"
	}

	//Rewrite HTML h1#title and a#url based on their animal
	rewriter.on('h1#title', new textChanger(animal))
	rewriter.on('a#url', new urlChanger(animalURL))

	//Add message to let user know their animal is saved to cookies
	if(cookies) {
		rewriter.on('p#description', new textChanger(`You have received a ${animal}!\n
					 Your animal has been saved to your cookies.`))	
	}
	else{
		rewriter.on('p#description', new textChanger(`You have received a ${animal}!`))	
	}	

	let res = await fetch(variants[numVariant])
	res = new Response(res.body, res)

	//Set cookies to the user's variant
	res.headers.set('Set-Cookie', `num=${numVariant}`)
	
	//Return the response
	return rewriter.transform(res)
}
