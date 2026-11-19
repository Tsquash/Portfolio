/* Edit the visible portfolio content here. Image paths are relative to site/index.html. */
window.portfolioContent = {
  name: 'Caleb Lightfoot',
  title: 'Electrical & Computer Engineering',
  school: 'The University of Texas at Austin',
  bio: [
    'I am a Senior Electrical and Computer Engineering studying at UT Austin, specializing in computer architecture and embedded systems. Finding creative ways to solve problems has always been my passion. In my free time I design embedded smart home and productivity devices while exploring the bridge of hardware, software, and the internet.',
    'Outside of engineering, I enjoy running, cycling, hiking, and shooting film. You can browse some of my film scans and other video projects in the Media folder!'
  ],
  portrait: {
    src: 'assets/Photos/portrait.png',
    alt: 'Dithered  portrait',
  },
  github: 'https://github.com/Tsquash',
  linkedin: 'https://www.linkedin.com/in/caleb-lightfoot-8386b324b/',
  instagram: 'https://www.instagram.com/caleblightfoot/',
  spotify: 'https://open.spotify.com/user/cslight05',
  videos: [
    { id: 'monadnock.mv', name: 'Monadnock.mp4', src: 'assets/monadnock.mp4' },
    { id: 'dandelion.mv', name: 'Dandelion.mp4', src: 'assets/dandelion.mp4' }
  ],
  /* Generated from the project folders in assets/Projects. */
  projects: window.portfolioProjects || [],
  /* Generated from the subfolders in assets/Photos. */
  albums: window.portfolioPhotoAlbums || []
};
