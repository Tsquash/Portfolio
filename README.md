## My Portfolio Website
Hosted at [caleblightfoot.space](https://caleblightfoot.space/), this website serves to show my ECE projects and skills, some of my creative projects, and a few film photo albums. The website boots into an interactive desktop-like environment, where users can drag windows around, explore files and folders, and find
my social links on desktop icons. The experience is much better on desktop for these reasons! 

<img width="1469" height="837" alt="Portfolio Website UI" src="https://github.com/user-attachments/assets/b74fdb2e-5c71-44f1-a242-de20662f2757" />

The UI is designed to look like System 3.0, and [infinite mac](https://infinitemac.org/1986/System%203.0) was used as a helpful reference during the UI design. Another useful reference was the [classic macintosh UI kit](https://www.figma.com/community/file/1392611044307310359/classic-macintosh-ui-kit) on figma. 

Photo albums are automatically added to `/Media` in the UI when added to `/site/assets/Photos/album-name`, and any photos in `album-name` will be populated accordingly. This is done through `photo-albums.js` since the site is static! I have plans for a similar structure for adding projects soon, so that additional projects can be addded simply by putting a text file with the project name and project details in a `Projects` directory. Currently videos are hardcoded and will likely stay this way since there are only a couple. `
