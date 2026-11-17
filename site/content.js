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
  projects: [
    {
      id: 'air-quality',
      name: 'Air Quality Monitor',
      summary: 'Two ESP32-C6 devices work together to measure indoor air quality and publish the readings to a Matter controller.',
      parts: [
        {
          name: 'AirQualityMonitor',
          detail: 'The main monitor measures CO₂, temperature, humidity, VOC, and NOₓ, shows current readings and recent history on an e-paper display, and publishes measurements over Matter via Wi-Fi.',
          url: 'https://github.com/Tsquash/AirQualityMonitor'
        },
        {
          name: 'particle',
          detail: 'The companion unit measures PM1.0, PM2.5, and PM10. It can display readings on its own e-paper screen and send one-minute averages to the main monitor over Bluetooth Low Energy.',
          url: 'https://github.com/Tsquash/particle/tree/main'
        }
      ],
      tags: ['ESP32-C6', 'Matter', 'BLE', 'E-paper', 'KiCad']
    }
  ],
  /* Generated from the subfolders in assets/Photos. */
  albums: window.portfolioPhotoAlbums || []
};
