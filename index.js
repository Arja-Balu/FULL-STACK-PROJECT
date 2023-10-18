let db;

function initializeDashboard() {
    const firebaseConfig = {
        apiKey: "AIzaSyDPItEXR_QWN60GuMLS57s7ptVYti5XVgY",
        authDomain: "find-my-book-3a2f8.firebaseapp.com",
        projectId: "find-my-book-3a2f8",
        storageBucket: "find-my-book-3a2f8.appspot.com",
        messagingSenderId: "676583618370",
        appId: "1:676583618370:web:2d423424232b20579cbadb"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    } else {
        firebase.app();
    }
    db = firebase.firestore();

    document.querySelectorAll('.sidebar button').forEach(button => {
        button.addEventListener('click', function() {
            showContent(this.getAttribute('data-content'));
        });
    });

    document.getElementById('bookQueryForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const bookName = document.getElementById('bookName').value.trim();
        if (bookName) {
            addToAskedBooks(bookName);
        }
        this.reset();
    });

    const clearUploadedBooksBtn = document.getElementById('clearUploadedBooks');
    if(clearUploadedBooksBtn) {
        clearUploadedBooksBtn.addEventListener('click', clearUploadedBooksDisplay);
    }

    displayExistingData();
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in.
            displayAccountDetails();
        } else {
            // No user is signed in.
            console.log("User is not authenticated.");
        }
    });
    showContent('askForBook');
}

function showContent(contentId) {
    const contentDivs = document.querySelectorAll('.content');
    contentDivs.forEach(div => div.style.display = 'none');
    document.getElementById(contentId).style.display = 'block';
}

function addToAskedBooks(bookName) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert("You need to be logged in to ask for a book.");
        return;
    }

    const userId = currentUser.uid;
    const password = prompt("Set a password for this book request:");
    if (!password) {
        alert("You need to set a password to ask for a book.");
        return;
    }
    const hashedPassword = btoa(password);

    const askedList = document.getElementById('askedList');
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <strong>${bookName}</strong>
        <div>
            <button onclick="toggleMessageArea('${bookName}')">Leave a Message</button>
            <button onclick="toggleUploadArea('${bookName}')">Upload Book</button>
            <button onclick="clearAskedBook('${bookName}')">Clear</button>
        </div>
        <div id="messageArea_${bookName}" style="display: none;">
            <textarea placeholder="Type your message..."></textarea>
            <button onclick="submitMessageForBook('${bookName}')">Send</button>
            <button id="toggleMessageButton_${bookName}" onclick="toggleMessages('${bookName}')">Show Messages</button>
            <div id="messagesFor_${bookName}" style="display: none;"></div>
        </div>
        <div id="uploadArea_${bookName}" style="display: none;">
            <input type="file" id="fileUploadFor_${bookName}">
            <button onclick="uploadFileForBook('${bookName}')">Upload</button>
        </div>
    `;

    db.collection('askedBooks').where("name", "==", bookName).get().then(snapshot => {
        if (snapshot.empty) {
            db.collection('askedBooks').add({
                name: bookName,
                messages: [],
                userId: userId,
                hashedPassword: hashedPassword
            })
            .then(docRef => {
                askedList.appendChild(listItem);
                displayAskedBooks();
            });
        } else {
            alert("This book already exists in the asked books section.");
        }
    });
}

function attemptClearBook(bookName, hashedPasswordStored) {
    const password = prompt("Enter your password to clear the book:");
    const hashedPasswordInput = btoa(password);

    if(hashedPasswordInput === hashedPasswordStored) {
        clearAskedBook(bookName);
    } else {
        alert("Password didn't match. Please try again.");
    }
}

function toggleMessageArea(bookName) {
    const messageArea = document.getElementById(`messageArea_${bookName}`);
    const uploadArea = document.getElementById(`uploadArea_${bookName}`);
    messageArea.style.display = messageArea.style.display === 'none' ? 'block' : 'none';
    uploadArea.style.display = 'none';
}

function toggleUploadArea(bookName) {
    const uploadArea = document.getElementById(`uploadArea_${bookName}`);
    const messageArea = document.getElementById(`messageArea_${bookName}`);
    uploadArea.style.display = uploadArea.style.display === 'none' ? 'block' : 'none';
    messageArea.style.display = 'none';
}

function submitMessageForBook(bookName) {
    const messageArea = document.getElementById(`messageArea_${bookName}`);
    const textarea = messageArea.querySelector('textarea');
    const message = textarea.value;
    if (message) {
        appendMessageToArea(bookName, message);
        textarea.value = '';
        const bookRef = db.collection('askedBooks').where("name", "==", bookName);
        bookRef.get().then(querySnapshot => {
            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id;
                const currentMessages = querySnapshot.docs[0].data().messages || [];
                currentMessages.push(message);
                db.collection('askedBooks').doc(docId).update({
                    messages: currentMessages
                });
            }
        });
    } else {
        alert('Please enter a message before submitting.');
    }
}

function toggleMessages(bookName) {
    const messagesDiv = document.getElementById(`messagesFor_${bookName}`);
    const button = document.getElementById(`toggleMessageButton_${bookName}`);
    if (messagesDiv.style.display === 'none') {
        messagesDiv.style.display = 'block';
        button.textContent = "Close Messages";
    } else {
        messagesDiv.style.display = 'none';
        button.textContent = "Show Messages";
    }
}

function appendMessageToArea(bookName, messageContent) {
    const messageContainer = document.getElementById(`messagesFor_${bookName}`);
    const messageDiv = document.createElement('div');
    const messageParagraph = document.createElement('p');
    messageParagraph.className = "message-content";
    messageParagraph.textContent = messageContent;
    messageDiv.appendChild(messageParagraph);
    const replyButton = document.createElement('button');
    replyButton.textContent = "Reply";
    replyButton.onclick = function() {
        handleReplyLogic(messageDiv, bookName);
    };
    messageDiv.appendChild(replyButton);
    messageContainer.appendChild(messageDiv);
}

function handleReplyLogic(messageDiv, bookName) {
    const replyContainer = messageDiv.querySelector('.message-reply-container');
    if (!replyContainer) {
        const newReplyContainer = document.createElement('div');
        newReplyContainer.className = 'message-reply-container';
        const replyTextArea = document.createElement('textarea');
        replyTextArea.placeholder = "Type your reply...";
        const sendReplyButton = document.createElement('button');
        sendReplyButton.textContent = "Send Reply";
        sendReplyButton.onclick = function() {
            const replyMessage = replyTextArea.value;
            if (replyMessage) {
                appendMessageToArea(bookName, replyMessage);
                messageDiv.removeChild(newReplyContainer);
            }
        };
        newReplyContainer.appendChild(replyTextArea);
        newReplyContainer.appendChild(sendReplyButton);
        messageDiv.appendChild(newReplyContainer);
    } else {
        messageDiv.removeChild(replyContainer);
    }
}

function uploadFileForBook(bookName) {
    const file = document.getElementById(`fileUploadFor_${bookName}`).files[0];
    if (!file) {
        alert('No file selected!');
        return;
    }
    const storageRef = firebase.storage().ref('books/' + file.name);
    const uploadTask = storageRef.put(file);
    uploadTask.on('state_changed',
        function(snapshot) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            alert("upload successfull");
        },
        function() {},
        function() {
            storageRef.getDownloadURL().then(url => {
                const bookRef = db.collection('askedBooks').where("name", "==", bookName);
                bookRef.get().then(querySnapshot => {
                    if (!querySnapshot.empty) {
                        const docId = querySnapshot.docs[0].id;
                        db.collection('askedBooks').doc(docId).update({
                            fileUrl: url
                        })
                        .then(() => {
                            displayAskedBooks();
                            displayBooksAndDownloadLinks();
                        });
                    }
                });
            });
        }
    );
}

function clearAskedBook(bookName) {
    const currentUser = firebase.auth().currentUser;

    if (!currentUser) {
        alert("You need to be logged in to clear a book.");
        return;
    }

    const userId = currentUser.uid;

    const enteredPassword = prompt("Enter password to clear the book:");
    if (!enteredPassword) {
        alert("You need to provide a password to clear the book.");
        return;
    }

    const hashedEnteredPassword = btoa(enteredPassword);

    const bookRef = db.collection('askedBooks').where("name", "==", bookName);
    bookRef.get().then(querySnapshot => {
        if (!querySnapshot.empty) {
            const bookData = querySnapshot.docs[0].data();
            if (bookData.userId === userId && bookData.hashedPassword === hashedEnteredPassword) {
                const docId = querySnapshot.docs[0].id;
                db.collection('askedBooks').doc(docId).delete()
                .then(() => {
                    displayAskedBooks();
                });
            } else {
                alert("Password didn't match or you are not the owner of this request. You cannot clear this book.");
            }
        } else {
            alert("Book not found in the database.");
        }
    });
}

function displayBooksAndDownloadLinks() {
    const uploadedList = document.getElementById('uploadedBooksList');
    while (uploadedList.firstChild) {
        uploadedList.removeChild(uploadedList.firstChild);
    }
    db.collection('askedBooks').where("fileUrl", "!=", null).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const bookData = doc.data();
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${bookData.name}</strong>`;
            if (bookData.fileUrl) {
                const downloadLink = document.createElement('a');
                downloadLink.href = bookData.fileUrl;
                downloadLink.textContent = " Download";
                downloadLink.target = "_blank";
                listItem.appendChild(downloadLink);
            }
            uploadedList.appendChild(listItem);
        });
    });
}

function clearUploadedBooksDisplay() {
    const uploadedBooksSection = document.getElementById('uploadedBooks');
    while (uploadedBooksSection.firstChild) {
        uploadedBooksSection.removeChild(uploadedBooksSection.firstChild);
    }
}

function displayExistingData() {
    displayBooksAndDownloadLinks();
    displayAskedBooks();
}

function displayAskedBooks() {
    const askedList = document.getElementById('askedList');
    while (askedList.firstChild) {
        askedList.removeChild(askedList.firstChild);
    }
    db.collection('askedBooks').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const bookData = doc.data();
            if (!bookData.fileUrl) {
                db.collection("users").doc(bookData.userId).get().then(userDoc => {
                    const userData = userDoc.data();
                    const username = userData.username;
                    const userEmail = userData.email;
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<strong>${bookData.name}</strong>`;
                    listItem.innerHTML += `
                        <span class="username-tag">${username}</span>
                        <div>
                            <button onclick="toggleMessageArea('${bookData.name}')">Leave a Message</button>
                            <button onclick="toggleUploadArea('${bookData.name}')">Upload Book</button>
                            <button onclick="clearAskedBook('${bookData.name}')">Clear</button>
                            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${userEmail}&su=Inquiry about ${bookData.name}" target="_blank" class="send-email-icon"><img src="gmail.png"></a>
                        </div>
                        <div id="messageArea_${bookData.name}" style="display: none;">
                            <textarea placeholder="Type your message..."></textarea>
                            <button onclick="submitMessageForBook('${bookData.name}')">Send</button>
                            <button id="toggleMessageButton_${bookData.name}" onclick="toggleMessages('${bookData.name}')">Show Messages</button>
                            <div id="messagesFor_${bookData.name}" style="display: none;"></div>
                        </div>
                        <div id="uploadArea_${bookData.name}" style="display: none;">
                            <input type="file" id="fileUploadFor_${bookData.name}">
                            <button onclick="uploadFileForBook('${bookData.name}')">Upload</button>
                        </div>`;
                    if (bookData.messages && bookData.messages.length > 0) {
                        const messagesContainer = listItem.querySelector(`#messagesFor_${bookData.name}`);
                        bookData.messages.forEach(message => {
                            const messageDiv = document.createElement('div');
                            messageDiv.textContent = message;
                            messagesContainer.appendChild(messageDiv);
                        });
                    }
                    askedList.appendChild(listItem);
                });
            }
        });
    });
}

function displayAccountDetails() {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        const userId = currentUser.uid;
        db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                const accountDetailsSection = document.getElementById('accountDetails');
                const usernameDisplay = document.getElementById('usernameDisplay');
                const emailDisplay = document.getElementById('emailDisplay');
                usernameDisplay.textContent = userData.username;
                emailDisplay.textContent = userData.email;
            }
        });
    }
}

function updateUsername() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert("You need to be logged in to change your username.");
        return;
    }
    const newUsername = document.getElementById('newUsername').value.trim();
    if (!newUsername) {
        alert("Please enter a valid new username.");
        return;
    }
    const userId = currentUser.uid;
    db.collection('users').doc(userId).update({
        username: newUsername
    })
    .then(() => {
        alert("Username updated successfully!");
        displayAccountDetails();
    });
}

function createUserIfNeeded() {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        const userId = currentUser.uid;
        db.collection('users').doc(userId).get().then(doc => {
            if (!doc.exists) {
                db.collection('users').doc(userId).set({
                    email: currentUser.email,
                    username: prompt("Enter your username: ")
                }).then(() => {
                    displayAccountDetails();
                });
            }
        });
    }
}
function logout(){
    window.location.href='login.html'
}
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});
