//yggdrasil.js

var route="/project";
var breadcrumbs=["/"];
var phonegap = true;
var baseurl="https://www.talkisbetter.com"

//resources to use with api and url to find endpoints
var projectsResource = "projects";
var blogsResource = "blogs";
var usersResource = "users";
var tasksResource = "tasks";
var kanbansResource = "kanbanslots";
var trashsResource = "trashs";

//this is overriden later if dev or test at start of url
var apiPath = "/api/";
var dev=0;

var authResource = "auth";

//initialise global variables used for edit
var projects={};
var tasks={};
var kanbanslots={};
var users={};
var blogs={};
var id = null;
var jwtToken = null;

// ##### main template area - router
function refresh(id) {

	rewriteUrlFromRoute();	
	setApiPath();	

	jwtToken = fetchJwt();
	if (jwtToken==null) {
		jwtToken={ admin: false, username: "Guest", roles: ""};
		storeJwt();
	}
	
	var hideButtons = route.includes("edit") || route.includes("add");
	var addButton = document.getElementById("addButton"); 
	if (hideButtons == false) {
		var requiredRole = route.replace("/","")+"-editor";
		if (jwtToken.roles.includes(requiredRole)) {
			addButton.style.display = "block";
		} else {
			addButton.style.display = "none";
		}
	} else {
		addButton.style.display = "none";
	}
	
	var adminButton = document.getElementById("adminButton"); 
	if (hideButtons == false) {
		if (jwtToken.admin == true) {
			adminButton.style.display = "block";
		} else {
			adminButton.style.display = "none";
		}
	} else {
		adminButton.style.display = "none";
	}
	
	var slotButton = document.getElementById("slotButton"); 
	if (hideButtons == false) {
		var requiredRole = "slot-editor";
		if (jwtToken.roles.includes(requiredRole)) {
			addButton.style.display = "block";
		} else {
			addButton.style.display = "none";
		}
	} else {
		addButton.style.display = "none";
	}
	

	switch(route) {
		
		case "/project":     navigateState("Yggsrasil Projects", applyProjectsTemplate ); break;
		case "/project/add": navigateState("Add Project", applyAddProjectTemplate ); break;
		case "/project/edit": navigateState("Edit Project", applyEditProjectTemplate, id ); break;
		
		case "/blog": navigateState("Jeff Davies' Blog", applyBlogTemplate ); break;
		case "/blog/add": navigateState("Add Blog", applyAddBlogTemplate ); break;
		case "/blog/edit": navigateState("Edit Blog", applyEditBlogTemplate, id ); break;
		
		case "/task": navigateState("Kanban", applyTasksTemplate ); break;
		case "/task/add": navigateState("Add Task", applyAddTasksTemplate ); break;
		case "/task/edit": navigateState("Edit Task", applyEditTasksTemplate, id ); break;
		case "/task/edit-slots": navigateState("Edit Kanban Slots", applyEditKanbanSlotsTemplate ); break;
		
		case "/kanbanslot": navigateState("Kanban", applyKanbanslotsTemplate ); break;
		case "/kanbanslot/add": navigateState("Add Kanbanslot", applyAddKanbanslotsTemplate ); break;
		case "/kanbanslot/edit": navigateState("Edit Kanbanslot", applyEditKanbanslotsTemplate, id ); break;
		case "/kanbanslot/edit-slots": navigateState("Edit Kanban Slots", applyEditKanbanSlotsTemplate ); break;
		
		case "/user": navigateState("Users", applyUsersTemplate ); break;
		case "/user/add": navigateState("Add User", applyAddUsersTemplate ); break;
		case "/user/edit": navigateState("Edit User", applyEditUsersTemplate, id ); break;

		case "/trash":     navigateState("LoadOfRubbish.com", applyTrashTemplate ); break;
		case "/trash/add": navigateState("Add Trash", applyAddTrashTemplate ); break;
		case "/trash/edit": navigateState("Edit Trash", applyEditTrashTemplate, id ); break;
		
	} 
		
}

// ##### main template area (binding from add edit view controllers like React reducers)
function getPayloadForResource(resource) {
	var payload = {};
	switch (resource) {
		
		case "projects": 
			payload = {
				"title":       document.getElementById("editProjectProjectName").value,
				"description": document.getElementById("editProjectProjectDescription").value,
				"year":        document.getElementById("editProjectProjectYear").value,
				"codeUrl":     document.getElementById("editProjectProjectCodeUrl").value,
				"url":         document.getElementById("editProjectProjectUrl").value,
				"pdfUrl":      document.getElementById("editProjectProjectPdfUrl").value
			};
			break;
			
		case "blogs":
			payload = {
				"storyName": document.getElementById("editBlogStoryname").value,
				"storyText": document.getElementById("editBlogStorytext").value,
				"date":      document.getElementById("editBlogStorydate").value
			};
			break;
		case "users":
			payload = {
				"username": document.getElementById("userEditUsername").value,
				"password": document.getElementById("userEditPassword").value,
				"roles":      document.getElementById("userEditRoles").value,
				"admin":      false
			};
			break;
		case "tasks":
			payload = {
				"storyName": document.getElementById("editTaskStoryname").value,
				"storyText": document.getElementById("editTaskStorytext").value,
				"storySlot": document.getElementById("editTaskSlot").value,
			};
			break;
		case "kanbanslots":
			payload = {
				"slotOrder": document.getElementById("editSlotslotOrder").value,
				"slotName": document.getElementById("editSlotslotName").value
			};
			break;
		
		case "trashs":
			payload = {
				"location": document.getElementById("editTrashTrashLocation").value,
				"numberOfBags": document.getElementById("editTrashTrashNumberOfBags").value,
				"wasteType" : document.getElementById("editTrashTrashWasteType").value,
				"maxNumberOfHoursFromNow" : document.getElementById("editTrashTrashMaxNumberOfHoursFromNow").value,
			};
			break;
			
			
	}
	return payload;
}



// ##### main template rendering (binding like like React render function)
//trash Template rendering - 
function applyTrashTemplate() {
	clearRootNode();
	var cardrowTemplate = document.getElementById("cardRow-template");
	var cardTemplate = document.getElementById("trash-template");
	
	http_get_json(trashsResource,function (response) {
		trashs = response;
		
		var rowcount=0;
		var currentRow=null;
		
		trashs.forEach(function (trash) {
			if ((rowcount % 3) == 0) {
				currentRow = cardrowTemplate.cloneNode(true);
			}
			var node = cardTemplate.cloneNode(true);
			updateField( node, "location", trash.location);
			updateField( node, "id", trash._id);
			updateField( node, "wasteType", trash.wasteType);
			updateField( node, "numberOfBags", trash.numberOfBags);
			updateField( node, "maxNumberOfHoursFromNow", trash.maxNumberOfHoursFromNow);
			updateField( node, "editButton", makeEditAndDeleteButtons(trash._id));
			
			//hide buttons with undefined href and onclick   --> first button (0) is used for title, so ignore
			var allButtons = node.getElementsByClassName("btn");
			for (var i = 1; i < allButtons.length; i++) {
				
				var href =allButtons[i].getAttribute("href");
				var onclick = allButtons[i].getAttribute("onclick");
				
				var hrefNotFound = false;
				if(href==null) {
					hrefNotFound=true;
				} else {
					hrefNotFound = href.includes("undefined");
				}
				
				var onclickNotFound = onclick==null;
				if (href == "#"||href=="")
					hrefNotFound = true;
				if(onclick!=null) {
					if (onclick.includes("undefined")||onclick.includes("loadHtmlFragmentToRoot('')")) {
						onclickNotFound=true;
					}
				}
				
				if(hrefNotFound && onclickNotFound) {
					var classAttribute = allButtons[i].getAttribute("class");
					allButtons[i].className = classAttribute+" hidden";
				}
			}
			
			currentRow.append(node);
			if ((rowcount % 3) == 0) {
				appendNodeToRoot(currentRow);
			}
			rowcount++;
		});
	});
}

function applyAddTrashTemplate () {
	applyEditTrashTemplate(null);
}

function applyEditTrashTemplate (id) {
	clearRootNode();
	var blogTemplate = document.getElementById("edit-trash-template");
	var node = blogTemplate.cloneNode(true);
	root.append(node);
	var wasteType = "";
	var numberOfBags = 0;
	var maxNumberOfHoursFromNow=0;
	var location="";
	if(id!=null) {
		trashs.forEach(function (item) {
			if (item._id == id) {
				wasteType = item.wasteType;
				numberOfBags = item.numberOfBags;
				maxNumberOfHoursFromNow = item.maxNumberOfHoursFromNow;
				location = item.location;
			}
		});
	}
	updateFormField( "trashEditId", id);
	updateFormField( "editTrashTrashWasteType", wasteType);
	updateFormField( "editTrashTrashNumberOfBags", numberOfBags);
	updateFormField( "editTrashTrashMaxNumberOfHoursFromNow", maxNumberOfHoursFromNow);
	updateFormField( "editTrashTrashLocation", location);
}

//project Template 
function applyProjectsTemplate() {
	clearRootNode();
	var cardrowTemplate = document.getElementById("cardRow-template");
	var cardTemplate = document.getElementById("card-template");
	
	http_get_json(projectsResource,function (response) {
		projects = response;
		
		var rowcount=0;
		var currentRow=null;
		
		projects.forEach(function (project) {
			if ((rowcount % 3) == 0) {
				currentRow = cardrowTemplate.cloneNode(true);
			}
			var node = cardTemplate.cloneNode(true);
			updateField( node, "title", project.title);
			updateField( node, "id", project._id);
			updateField( node, "description", project.description);
			updateField( node, "year", project.year);
			updateField( node, "codeUrl", project.codeUrl);
			updateField( node, "siteUrl", project.siteUrl);
			updateField( node, "url", project.url);
			updateField( node, "pdfUrl", project.pdfUrl);
			updateField( node, "editButton", makeEditAndDeleteButtons(project._id));
			
			//hide buttons with undefined href and onclick   --> first button (0) is used for title, so ignore
			var allButtons = node.getElementsByClassName("btn");
			for (var i = 1; i < allButtons.length; i++) {
				
				var href =allButtons[i].getAttribute("href");
				var onclick = allButtons[i].getAttribute("onclick");
				
				var hrefNotFound = false;
				if(href==null) {
					hrefNotFound=true;
				} else {
					hrefNotFound = href.includes("undefined");
				}
				
				var onclickNotFound = onclick==null;
				if (href == "#"||href=="")
					hrefNotFound = true;
				if(onclick!=null) {
					if (onclick.includes("undefined")||onclick.includes("loadHtmlFragmentToRoot('')")) {
						onclickNotFound=true;
					}
				}
				
				if(hrefNotFound && onclickNotFound) {
					var classAttribute = allButtons[i].getAttribute("class");
					allButtons[i].className = classAttribute+" hidden";
				}
			}
			
			currentRow.append(node);
			if ((rowcount % 3) == 0) {
				appendNodeToRoot(currentRow);
			}
			rowcount++;
		});
	});
}

function applyAddProjectTemplate () {
	applyEditProjectTemplate(null);
}

function applyEditProjectTemplate (id) {
	clearRootNode();
	var blogTemplate = document.getElementById("edit-project-template");
	var node = blogTemplate.cloneNode(true);
	root.append(node);
	var title = "";
	var description = "";
	var year="";
	var codeUrl="";
	var url="";
	var pdfUrl="";
	if(id!=null) {
		projects.forEach(function (item) {
			if (item._id == id) {
				title = item.title;
				description = item.description;
				year = item.year;
				codeUrl = item.codeUrl;
				url = item.url;
				pdfUrl = item.pdfUrl;
			}
		});
	}
	updateFormField( "projectEditId", id);
	updateFormField( "editProjectProjectName", title);
	updateFormField( "editProjectProjectDescription", description);
	updateFormField( "editProjectProjectYear", year);
	updateFormField( "editProjectProjectCodeUrl", codeUrl);
	updateFormField( "editProjectProjectUrl", url);
	updateFormField( "editProjectProjectPdfUrl", pdfUrl);
}

//task Template rendering
function applyTasksTemplate() {
	clearRootNode();
	var kanbanTemplate = document.getElementById("kanban-template");
	var slotTemplate = document.getElementById("kanban-slot-template");
	var cardTemplate = document.getElementById("kanban-task-template");
	var headingTemplate = document.getElementById("kanban-heading-template");
	var kanbanRoot = kanbanTemplate.cloneNode(true);
	kanbanRoot.innerHTML = kanbanRoot.innerHTML.replace(/kanban-template/g,"kanbanroot");
	root.append(kanbanRoot); 

	var slotId=0;
	
	http_get_json(tasksResource,function (response) {
		
		var theseSlots = [
			{ slotName:"Ready To Pick Up"}, 
			{ slotName:"In Progress" }, 
			{ slotName:"Complete" }, 
			{ slotName:"In Test" },
			{ slotName:"Ready For Release" },
			{ slotName:"Released"} ];
		
		tasks = response;
		var currentSlotNode=null;
		
		//table one row, one TD per slot, multiple cards in one TD
		theseSlots.forEach(function(thisSlot) {

			var tasksInThisSlot="";
			//make the title task
			var taskNode = headingTemplate.cloneNode(true);
			updateField( taskNode, "storyName", thisSlot.slotName );
			updateField( taskNode, "storyText", "");
			updateField( taskNode, "id", "");
			updateField( taskNode, "editButton", "");
			tasksInThisSlot+= taskNode.innerHTML;
			
			tasks.forEach(function (task) {
				task.storySlot = task.storySlot.replace("/n/n","").replace("/r","").trim();
				if (task.storySlot=="" || task.storySlot==null)
					task.storySlot = theseSlots[0].slotName;
				if(task.storySlot == thisSlot.slotName) {
					var taskNode = cardTemplate.cloneNode(true);
					updateField( taskNode, "storyText", task.storyText);
					updateField( taskNode, "storyName", task.storyName);
					updateField( taskNode, "id", task._id);
					updateField( taskNode, "editButton", makeEditAndDeleteButtons(task._id));
					tasksInThisSlot+= taskNode.innerHTML;
				}
			});
			
			currentSlotNode = slotTemplate.cloneNode(true);
			currentSlotNode.id = slotId;
			updateField( currentSlotNode, "kanban-slot-template",  "slot"+id );
			updateField( currentSlotNode, "cards",  tasksInThisSlot );
			slotId++;
			var slots = document.getElementById("kanban-slots");
			slots.appendChild(currentSlotNode);
				
		});
		
	});

}

function applyAddTasksTemplate () {
	applyEditTasksTemplate(null);
}

function applyEditTasksTemplate (id) {
	var storyText = "";
	var storyName = "";
	var storySlot = "";
	if(id!=null) {
		tasks.forEach(function (item) {
			if (item._id == id) {
				storyText = item.storyText;
				storyName = item.storyName;
				storySlot = item.storySlot;
			}
		});
	}
	clearRootNode();
	var taskTemplate = document.getElementById("edit-task-template");
	var node = taskTemplate.cloneNode(true);
	root.append(node);
	updateFormField( "taskEditId", id);
	updateFormField( "editTaskStoryname", storyName);
	updateFormField( "editTaskStorytext", storyText);
	updateFormField( "editTaskSlot", storySlot);
}

//kanbanslot Template rendering
function applyKanbanslotsTemplate() {
	clearRootNode();
	var kanbanslotTemplate = document.getElementById("kanbanslot-template");

    var id=0;	
	http_get_json_restricted(kanbanslotsResource,function (response) {
		kanbanslots = response;
		
		kanbanslots.forEach(function (kanbanslot) {
			var node = kanbanslotTemplate.cloneNode(true);
			updateField( node, "slotName", kanbanslot.kanbanslotname);
			updateField( node, "editButton", makeEditAndDeleteButtons(kanbanslot._id));
			root.append(node);
			id++;
		});
	});
}

function applyAddKanbanslotsTemplate() {
	applyEditKanbanSlotsTemplate(null);
}

function applyEditKanbanslotsTemplate () {
	var slotOrder = "";
	var slotName = "";	
	if(id!=null) {
		kanbanslots.forEach(function (item) {
			if (item._id == id) {
				slotOrder = item.slotOrder;
				slotName = item.slotName;
			}
		});
	}
	clearRootNode();
	var slotTemplate = document.getElementById("edit-slot-template");
	var node = slotTemplate.cloneNode(true);
	root.append(node);
	updateFormField( "kanbanslotEditId", id);
	updateFormField( "editSlotslotOrder", slotOrder);
	updateFormField( "editSlotslotName", slotName);
}

//Blog Template Rendering
function applyBlogTemplate() {
	clearRootNode();
	var blogTemplate = document.getElementById("blog-template");
	http_get_json(blogsResource,function (response) {
		blogs = response;
		blogs.forEach(function (story) {
			var node = blogTemplate.cloneNode(true);
			updateField( node, "storyText", story.storyText);
			updateField( node, "storyName", story.storyName);
			updateField( node, "date", story.date);
			updateField( node, "id", story._id);
			updateField( node, "editButton", makeEditAndDeleteButtons(story._id));
			root.append(node);
		});
	});
}

function applyAddBlogTemplate () {
	applyEditBlogTemplate(null);
}

function applyEditBlogTemplate (id) {
	var storyText = "";
	var storyName = "";
	var date= "";	
	if(id!=null) {
		blogs.forEach(function (item) {
			if (item._id == id) {
				storyText = item.storyText;
				storyName = item.storyName;
				date = item.date;				
			}
		});
	}
	clearRootNode();
	var blogTemplate = document.getElementById("edit-blog-template");
	var node = blogTemplate.cloneNode(true);
	root.append(node);
	updateFormField( "blogEditId", id);
	updateFormField( "editBlogStoryname", storyName);
	updateFormField( "editBlogStorytext", storyText);
	updateFormField( "editBlogStorydate", date);
}

//User Template Rendering
function applyUsersTemplate () {
	clearRootNode();
	var userTemplate = document.getElementById("user-template");

    var id=0;	
	http_get_json_restricted(usersResource,function (response) {
		users = response;
		
		users.forEach(function (user) {
			var node = userTemplate.cloneNode(true);
			updateField( node, "username", user.username);
			updateField( node, "editButton", makeEditAndDeleteButtons(user._id));
			root.append(node);
			id++;
		});
	});
}

function applyAddUsersTemplate () {
	applyEditUsersTemplate(null);
}

function applyEditUsersTemplate (id) {
	var userEditUsername = "";
	var userEditPassword = "";
	var userEditRoles = "";
	
	if(id!=null) {
		users.forEach(function (item) {
			if (item._id == id) {
				userEditUsername = item.username;
				userEditPassword = item.password;
				userEditRoles = item.roles;
			}
		});
	}
	clearRootNode();
	var taskTemplate = document.getElementById("edit-user-template");
	var node = taskTemplate.cloneNode(true);
	root.append(node);
	updateFormField( "userEditId", id);
	updateFormField( "userEditUsername", userEditUsername);
	updateFormField( "userEditPassword", userEditPassword);
	updateFormField( "userEditRoles", userEditRoles);
	
}


//generic functions

// user action functions
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

function admin() {
	navigate('/user');
}

function addButton() {
	route = route+"/add";
	refresh();
}

function editButton(editId) {
	route = route+"/edit";
	refresh(editId);
}

function deleteButton(id) {
	var r = confirm("Are you sure you want to delete this?");
	if (r == true) {
		deleteRecord(id, refresh);
	} 
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function navigateBack() {
	var lastSlashIndex = route.lastIndexOf("/");
	var newRoute = route.slice(route,lastSlashIndex);
	route = newRoute;
	refresh();
}

function cancelChanges() {
	navigateBack();
}

function nullOperation() {}

function saveChanges() {
	//find resource
	var lastSlashIndex = route.lastIndexOf("/");
	var routeWithoutAdd = route.slice(route,lastSlashIndex);
	var fieldprefix = routeWithoutAdd.replace("/","");
	resource = fieldprefix+"s";
	var payload = getPayloadForResource(resource);
	
	var idField=document.getElementById(fieldprefix+"EditId");
	var id = idField.value;
	
	if(id==null || id=="") { //then save with post
		http_post(resource,payload,navigateBack,updateFailed);
	} else { //then update with put
		http_put(resource+"/"+id,payload,navigateBack,updateFailed);
	}
	
}

function updateFailed() {
	alert("update failed");
}

function deleteRecord(id, callback) {
	var resource = route.replace("/","")+"s";
	http_del(resource+"/"+id,deleteFailed, callback);
}

function deleteFailed() {
	alert("delete failed");
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
	if(route.includes("task")) {
		var newState = ev.currentTarget.childNodes[1].innerText.replace("/n/n","").replace("/r","").trim();
		var id = ev.srcElement.id;
		var task = null;
		tasks.forEach(function(task) {
			if (task._id == data) {
				task.storySlot = newState;
				ev.target.appendChild(document.getElementById(data));
				var url="tasks"
				http_put(url+"/"+task._id,task,nullOperation,updateFailed);
			}
		});
		
	}
}

function loadHtmlFragmentToRoot(url) {
	http_get_html(url,function(blobCallback) {
		var root = document.getElementById("root");
		//clear all nodes from root
		while (root.firstChild) {
			root.removeChild(root.firstChild);
		};
		blobCallback.then(function(blob) {
			root.innerHTML = blob;
		});
	});
}


function registerServiceWorker () {
	//register the service worker
	if ('serviceWorker' in navigator) {
	  window.addEventListener('load', function() {
		navigator.serviceWorker.register('sw.js').then(function(registration) {
		  // Registration was successful
		  console.log('ServiceWorker registration successful with scope: ', registration.scope);
		}).catch(function(err) {
		  // registration failed :(
		  console.log('ServiceWorker registration failed: ', err);
		});
	  });
	}
}

function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}


//rendering helpers
function updateField(node, name,value) {
	var re = new RegExp("{{"+name+"}}","g");
	node.innerHTML = node.innerHTML.replace(re, value);
}

function updateFormField(id,value) {
	var field = document.getElementById(id);	
	field.value=value;
}

function updateFormButtonClick(id,value) {
	var field = document.getElementById(id);	
	field.onclick=value;
}

function makeEditAndDeleteButtons(id) {
	var requiredRole = route.replace("/","")+"-editor";
	var editButton="";
	if (jwtToken.roles.includes(requiredRole))
		editButton='<i class="fa fa-trash fa-3x pull-right" onclick="deleteButton(\''+id+'\')" aria-hidden="true"></i><i class="fa fa-pencil fa-3x pull-right" onclick="editButton(\''+id+'\')" aria-hidden="true"></i>';
	return editButton;
}

function clearRootNode() {
	var root = document.getElementById("root");
	while (root.firstChild) {
		root.removeChild(root.firstChild);
	}
}

function appendNodeToRoot(node) {
	var root = document.getElementById("root");
	root.append(node);
}


//state and route functions
function rewriteUrlFromRoute() {
	var url = window.location.href;
	var parts = url.split("#");
	window.location.replace(parts[0] + "#" + route);
}

function setApiPath() {
	var url=window.location.href;
	if (url.includes("dev.")) {
		dev=1;
		apiPath="/devapi/";
	}
}

function navigate(newroute) {
	route=newroute;
	refresh();
}

function navigateState(stateTitle,templateFunction, id) {
	var title=document.getElementById("pageTitle");
	title.innerHTML=stateTitle;
	document.title = stateTitle;
	templateFunction(id);
}


//http methods
function http_get_json(url, callback) {
	fetch(baseurl + apiPath + url, {'mode': 'no-cors'}).then(function(response) {
		var response2 = response.clone();
		if(typeof caches != 'undefined' && caches!=null && phonegap ==false) {
			caches.open('v1').then(function(cache) {
				return cache.put(apiPath + url, response2);
			});		
		}
		return response.json();
	}).then(function(data) {
		rewriteUrlFromRoute();	
		callback(data);
	}).catch(function(err) {
	  	console.log("Failed To Get Url "+err);
	});
}

function http_get_html(url, callback) {
	fetch(url, { mode: 'no-cors' }).then(function(response) {
		var response2 = response.clone();
		if(typeof caches != 'undefined' && caches!=null && phonegap ==false) {
			caches.open('v1').then(function(cache) {
				return cache.put(url, response2);
			});		
		}
		return response;
	}).then(function(data) {
		rewriteUrlFromRoute();	
		callback(data.text());
	}).catch(function(err) {
		console.log("Failed To Get Url "+err);
	});
}

function http_get_json_restricted(url, callback) {
	if(jwtToken.token==null) {
		//alert("you must login to use this resource");
		logout();
		return;
	}
	if(jwtToken.token.expiry < Date.now() ) {
		alert("Token has expired you must login to use this resource");
		logout();
		return;
	}
	fetch(baseurl + apiPath + url,
	{
    	method: "get", 
		headers: {
        	'Accept': 'application/json, text/plain, */*',
        	'Content-Type': 'application/json',
			'jwt': jwtToken.token
    	},
		'mode': 'no-cors'
	}).then(function(res){ 
		return res.json();
	}).then(function(data){ 
		rewriteUrlFromRoute();	
		callback(data);
	}).catch(function(err) {
	  	console.log("Failed To Get Url "+err);
	});
}

function http_post(url,payload,callback,errorCallback) {
	if(jwtToken.token==null) {
		//alert("you must login to use this resource");
		logout();
		return;
	}
	if(jwtToken.token.expiry < Date.now() ) {
		alert("Token has expired you must login to use this resource");
		logout();
		return;
	}
	var json = {
    	json: JSON.stringify(payload),
    	delay: 3
	};
	fetch(baseurl + apiPath + url,
	{
    	method: "post", 
		headers: {
        	'Accept': 'application/json, text/plain, */*',
        	'Content-Type': 'application/json',
			'jwt': jwtToken.token
    	},
        body: json = JSON.stringify(payload),
		'mode': 'no-cors'
	})
	.then(function(res){ 
		return res.json();
	})
	.then(callback).catch(errorCallback);
}

function http_put(url,payload,callback,errorCallback) {
	if(jwtToken.token==null) {
		//alert("you must login to use this resource");
		logout();
		return;
	}
	if(jwtToken.token.expiry < Date.now() ) {
		alert("Token has expired you must login to use this resource");
		logout();
		return;
	}
	var json = {
    	json: JSON.stringify(payload),
    	delay: 3
	};
	fetch(baseurl + apiPath + url,
	{
    	method: "put", 
		headers: {
        	'Accept': 'application/json, text/plain, */*',
        	'Content-Type': 'application/json',
			'jwt': jwtToken.token
    	},
        body: json = JSON.stringify(payload),
		'mode': 'no-cors'
	})
	.then(function(res){ 
		return res.json();
	})
	.then(callback).catch(errorCallback);
}

function http_del(url,errorCallback, callback) {
	if(jwtToken.token==null) {
		//alert("you must login to use this resource");
		logout();
		return;
	}
	if(jwtToken.token.expiry < Date.now() ) {
		alert("Token has expired you must login to use this resource");
		logout();
		return;
	}
	fetch(baseurl + apiPath + url,
	{
    	method: "delete", 
		headers: {
        	'Accept': 'application/json, text/plain, */*',
        	'Content-Type': 'application/json',
			'jwt': jwtToken.token
    	},
		'mode': 'no-cors'
	})
	.then(function(res){
		return;
	})
	.then(callback).catch(errorCallback);
}

//auth methods
function emptyJwt() {
	return {
		"admin" : false,
		"roles" : "",
		"username" : "guest"
	};
}

function logout() {
	jwtToken = emptyJwt();
	storeJwt();
	refresh();
}

function login() {
	var loginStatus = document.getElementById('loginStatus');
	loginStatus.innerHTML = "";
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;
	var payload = {
    	"username": username,
	    "password": password
	};
	
	var json = {
    	json: JSON.stringify(payload),
    	delay: 3
	};
	fetch(apiPath + authResource,
	{
    	method: "post", 
		headers: {
        	'Accept': 'application/json, text/plain, */*',
        	'Content-Type': 'application/json'
    	},
        body: json = JSON.stringify(payload)
	})
	.then(function(res){ 
		return res.json();
	})
	.then(function(token){ 
		jwtToken = token;
        storeJwt(token);
		if (jwtToken.loginSuccess==true) {
			var modal = document.getElementById('myModal');
			loginModal.style.display = "none";
			closeNav();
			refresh();
		} else {
			var modal = document.getElementById('loginStatus');
			modal.innerHTML = "failed to login";
		};
	}).catch(function(err) {
		var loginStatus = document.getElementById('loginStatus');
		loginStatus.innerHTML = "failed to login";
		jwtToken = {};
	});
}

var storeJwt = function (value) {
	localStorage.setItem('jwt', JSON.stringify(value));
}

function fetchJwt() {
	var token = localStorage.getItem('jwt');
	if (token == null || token =="" || token == "undefined") {
		jwtToken = emptyJwt();
		storeJwt(jwtToken);
	} else {
		var jwtToken = JSON.parse(token);
	}
	return jwtToken;
}

function initialise_websocketConnection() {
	var serviceUrl = "wss://wss.talkisbetter.com";
        var socket = new WebSocket(serviceUrl);

        socket.onopen = function () {
            console.log('Connection Established!');
            socket.send("Hello WebSocket!");
            //socket.close();
        };

        socket.onclose = function () {
            console.log('Connection Closed!');
        };

        socket.onerror = function (error) {
            console.log('Error Occured: ' + error);
        };

        socket.onmessage = function (e) {
            if (typeof e.data === "string") {
                console.log('String message received: ' + e.data);
                var res = e.data.split("~");
                document.getElementById(res[0]).innerHTML = '<p>' + res[1] + '</p>';
            }
            else if (e.data instanceof ArrayBuffer) {
                console.log('ArrayBuffer received: ' + e.data);
            }
            else if (e.data instanceof Blob) {
                console.log('Blob received: ' + e.data);
            }
        };

}

function polyFillForIE() {
	if (!String.prototype.includes) {
	  String.prototype.includes = function(search, start) {
		'use strict';
		if (typeof start !== 'number') {
		  start = 0;
		}
		
		if (start + search.length > this.length) {
		  return false;
		} else {
		  return this.indexOf(search, start) !== -1;
		}
	  };
	}
	
	//append polyfill
	// Source: https://github.com/jserz/js_piece/blob/master/DOM/ParentNode/append()/append().md
	(function (arr) {
	  arr.forEach(function (item) {
		if (item.hasOwnProperty('append')) {
		  return;
		}
		Object.defineProperty(item, 'append', {
		  configurable: true,
		  enumerable: true,
		  writable: true,
		  value: function append() {
			var argArr = Array.prototype.slice.call(arguments),
			  docFrag = document.createDocumentFragment();
			
			argArr.forEach(function (argItem) {
			  var isNode = argItem instanceof Node;
			  docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
			});
			
			this.appendChild(docFrag);
		  }
		});
	  });
	})([Element.prototype, Document.prototype, DocumentFragment.prototype]);
	
	//fetch polyfill from https://github.com/camsong/fetch-ie8/blob/master/fetch.js
(function(self) {
  'use strict';

  // if __disableNativeFetch is set to true, the it will always polyfill fetch
  // with Ajax.
  if (!self.__disableNativeFetch && self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob, options) {
    var reader = new FileReader()
    var contentType = options.headers.map['content-type'] ? options.headers.map['content-type'].toString() : ''
    var regex = /charset\=[0-9a-zA-Z\-\_]*;?/
    var _charset = blob.type.match(regex) || contentType.match(regex)
    var args = [blob]

    if(_charset) {
      args.push(_charset[0].replace(/^charset\=/, '').replace(/;$/, ''))
    }

    reader.readAsText.apply(reader, args)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body, options) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
        this._options = options
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob, this._options)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body, options)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit, options)
    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      var __onLoadHandled = false;

      function onload() {
        if (xhr.readyState !== 4) {
          return
        }
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          if (__onLoadHandled) { return; } else { __onLoadHandled = true; }
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;

        if (__onLoadHandled) { return; } else { __onLoadHandled = true; }
        resolve(new Response(body, options))
      }
      xhr.onreadystatechange = onload;
      xhr.onload = onload;
      xhr.onerror = function() {
        if (__onLoadHandled) { return; } else { __onLoadHandled = true; }
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      // `withCredentials` should be setted after calling `.open` in IE10
      // http://stackoverflow.com/a/19667959/1219343
      try {
        if (request.credentials === 'include') {
          if ('withCredentials' in xhr) {
            xhr.withCredentials = true;
          } else {
            console && console.warn && console.warn('withCredentials is not supported, you can ignore this warning');
          }
        }
      } catch (e) {
        console && console.warn && console.warn('set withCredentials error:' + e);
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true

  // Support CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = self.fetch;
  }
})(typeof self !== 'undefined' ? self : this);

//polyfill for Promise from https://github.com/taylorhakes/promise-polyfill/blob/master/promise.js

(function (root) {

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;

  function noop() {}
  
  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  function Promise(fn) {
    if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function() {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var prom = new (this.constructor)(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function (arr) {
    var args = Array.prototype.slice.call(arr);

    return new Promise(function (resolve, reject) {
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (value && typeof value === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (values) {
    return new Promise(function (resolve, reject) {
      for (var i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    });
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn = (typeof setImmediate === 'function' && function (fn) { setImmediate(fn); }) ||
    function (fn) {
      setTimeoutFunc(fn, 0);
    };

  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  /**
   * Set the immediate function to execute callbacks
   * @param fn {function} Function to execute
   * @deprecated
   */
  Promise._setImmediateFn = function _setImmediateFn(fn) {
    Promise._immediateFn = fn;
  };

  /**
   * Change the function to execute on unhandled rejection
   * @param {function} fn Function to execute on unhandled rejection
   * @deprecated
   */
  Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
    Promise._unhandledRejectionFn = fn;
  };
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Promise;
  } else if (!root.Promise) {
    root.Promise = Promise;
  }

})(this);


	
	
} //end of polyfill


window.onload = function(){
	polyFillForIE();
	registerServiceWorker();
	
	jwtToken=emptyJwt();
	
	var loginModal = document.getElementById('loginModal');

	var loginBtn = document.getElementById("loginBtn");
	loginBtn.onclick = function() {
		loginModal.style.display = "block";
	} 

	var logoutBtn = document.getElementById("logoutBtn");
	logoutBtn.onclick = function() {
		logout();
	}

	var loginDialogClose = document.getElementById("loginClose");
	loginDialogClose.onclick = function() {
		loginModal.style.display = "none";
	}

	window.onclick = function(event) {
		if (event.target == loginModal) {
			loginModal.style.display = "none";
		}

	}
	
	var currentUrl = window.location.href ;
	var parts = currentUrl.split("#");
	if (parts.length<2) {
		route="/project";
	} else {
		route = parts[1];	
	}
	
	initialise_websocketConnection();
	
	refresh();

}



