Project title: Chess
------------------------------------------------------------------------------------------------------------
Tech stack:
The Front-End of the project was developed using the React library, along with the NextUI (HeroUI) component library and the Tailwind CSS framework.

The Back-End was built in a Node.js environment using the Express.js framework. TypeORM will be used to simplify database interactions.

For data storage, PostgreSQL RDBMS will be used, integrated within a Docker container.
------------------------------------------------------------------------------------------------------------
Description: A user system exists where each user can create an account by providing an email and password.

(Additional integrations are possible, such as Google SSO, 2FA.)

Users can choose or change their nickname, profile picture, and country.

If a user wants to, the password can be changed.

Users can generate a game link and share it with friends. This allows both users to join the same game and compete. Depending on the result, both players' ratings are updated after the game.

If a player closes the website, they are considered to have lost the game.

If the user wishes, they can play against an opponent on the same device. This type of game does not affect the rating, and the result is not saved.

Users have a profile page that others can view. It displays information about the player, including their profile picture, nickname, country of origin and rating. Additionally, statistics on games against live opponents are shown, including wins, losses, and draws. Finally, match history is available, listing the results, date and time, and opponents.
------------------------------------------------------------------------------------------------------------
Installation instructions:
Prerequisites:
* Node.js
* Docker

Steps:
1. Create a folder for the project.
2. Open a code editor and open the created folder.
3. Open two terminals as you'll need them for both frontend and backend
4. Navigate to the project folder in both terminals:
    cd inzinerinis
5. In one terminal, navigate to the frontend folder:
    cd fe
6. In the other terminal, navigate to the backend folder:
    cd be
7. Then, in both terminals, install dependencies:
    npm install
8. After installation, start both frontend and backend:
    npm run dev
------------------------------------------------------------------------------------------------------------
Contributors:
Lukas Kasparavičius 

Vilius Viskantas 

Armandas Kronkaitis 

Evaldas Leckas