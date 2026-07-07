// Mock current user data
export const mockCurrentUser = {
  id: 'current-user',
  firstName: 'Alex',
  lastName: 'Morgan',
  age: 28,
  gender: 'female',
  lookingFor: 'male',
  photoUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
  location: 'San Francisco, CA',
  bio: 'Coffee enthusiast, book lover, and outdoor adventurer. Love to travel and explore new places. Looking for someone to share adventures with!',
  occupation: 'Product Designer',
  education: 'Stanford University',
  interests: ['Hiking', 'Reading', 'Photography', 'Yoga', 'Cooking'],
  stats: {
    matches: 67,
    likes: 241,
    profileViews: 534
  },
  preferences: {
    ageRange: [25, 35],
    distance: 25,
    lookingFor: ['relationship']
  }
};

// Mock user profile photos
export const mockUserPhotos = [
  { url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg' },
  { url: 'https://images.pexels.com/photos/1391498/pexels-photo-1391498.jpeg' },
  { url: 'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg' },
  { url: 'https://images.pexels.com/photos/2773977/pexels-photo-2773977.jpeg' },
  { url: 'https://images.pexels.com/photos/1124724/pexels-photo-1124724.jpeg' },
];

// Mock profiles for swiping
export const mockProfiles = [
  {
    id: '1',
    firstName: 'James',
    lastName: 'Wilson',
    age: 29,
    photoUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    location: 'San Francisco, CA',
    distance: 5,
    occupation: 'Software Engineer',
    education: 'MIT',
    bio: 'Tech enthusiast and fitness fanatic. I enjoy coding by day and hiking on weekends. Looking for someone who shares my love for the outdoors and trying new restaurants.',
    interests: ['Hiking', 'Coding', 'Fitness', 'Food'],
    verified: true
  },
  {
    id: '2',
    firstName: 'Emma',
    lastName: 'Johnson',
    age: 27,
    photoUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    location: 'Oakland, CA',
    distance: 10,
    occupation: 'Graphic Designer',
    education: 'RISD',
    bio: 'Creative soul with a passion for design and art. Love exploring museums, sketching in cafes, and finding inspiration in everyday moments.',
    interests: ['Art', 'Design', 'Coffee', 'Travel'],
    verified: true
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Brown',
    age: 31,
    photoUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    location: 'San Jose, CA',
    distance: 15,
    occupation: 'Marketing Manager',
    education: 'UC Berkeley',
    bio: 'Food lover, sports enthusiast, and always up for an adventure. Looking for someone to share good conversation and new experiences with.',
    interests: ['Basketball', 'Cooking', 'Hiking', 'Music'],
    verified: false
  },
  {
    id: '4',
    firstName: 'Sophie',
    lastName: 'Miller',
    age: 26,
    photoUrl: 'https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg',
    location: 'Palo Alto, CA',
    distance: 8,
    occupation: 'Data Scientist',
    education: 'Stanford',
    bio: 'Data nerd by day, bookworm by night. Love discussing everything from the latest tech to philosophy and art. Looking for someone thoughtful and curious.',
    interests: ['Reading', 'AI', 'Philosophy', 'Yoga'],
    verified: true
  },
  {
    id: '5',
    firstName: 'David',
    lastName: 'Garcia',
    age: 30,
    photoUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg',
    location: 'Mountain View, CA',
    distance: 12,
    occupation: 'Product Manager',
    education: 'UCLA',
    bio: 'Passionate about building products that make a difference. When not working, you can find me at a local brewery, on a hiking trail, or playing with my dog.',
    interests: ['Product Design', 'Dogs', 'Craft Beer', 'Running'],
    verified: false
  }
];

// Mock matches
export const mockMatches = [
  {
    id: '101',
    firstName: 'James',
    lastName: 'Wilson',
    age: 29,
    photoUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    location: 'San Francisco, CA',
    interests: ['Hiking', 'Coding', 'Fitness', 'Food'],
    matchedOn: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    verified: true
  },
  {
    id: '102',
    firstName: 'Emma',
    lastName: 'Johnson',
    age: 27,
    photoUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    location: 'Oakland, CA',
    interests: ['Art', 'Design', 'Coffee', 'Travel'],
    matchedOn: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    verified: true
  },
  {
    id: '103',
    firstName: 'Michael',
    lastName: 'Brown',
    age: 31,
    photoUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    location: 'San Jose, CA',
    interests: ['Basketball', 'Cooking', 'Hiking', 'Music'],
    matchedOn: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    verified: false
  },
  {
    id: '104',
    firstName: 'Sophie',
    lastName: 'Miller',
    age: 26,
    photoUrl: 'https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg',
    location: 'Palo Alto, CA',
    interests: ['Reading', 'AI', 'Philosophy', 'Yoga'],
    matchedOn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    verified: true
  },
  {
    id: '105',
    firstName: 'David',
    lastName: 'Garcia',
    age: 30,
    photoUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg',
    location: 'Mountain View, CA',
    interests: ['Product Design', 'Dogs', 'Craft Beer', 'Running'],
    matchedOn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    verified: false
  }
];

// Mock conversations
export const mockConversations = [
  {
    id: '201',
    user: {
      id: '101',
      firstName: 'James',
      lastName: 'Wilson',
      photoUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    },
    lastMessage: {
      id: '301',
      conversationId: '201',
      senderId: '101',
      text: 'Hey, want to grab coffee this weekend?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    read: false,
    isOnline: true,
    matchedOn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
  },
  {
    id: '202',
    user: {
      id: '102',
      firstName: 'Emma',
      lastName: 'Johnson',
      photoUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    },
    lastMessage: {
      id: '302',
      conversationId: '202',
      senderId: 'currentUser',
      text: 'I really enjoyed our conversation yesterday!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    read: true,
    isOnline: false,
    matchedOn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() // 4 days ago
  },
  {
    id: '203',
    user: {
      id: '103',
      firstName: 'Michael',
      lastName: 'Brown',
      photoUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
    },
    lastMessage: {
      id: '303',
      conversationId: '203',
      senderId: '103',
      text: 'That sounds great! What time works for you?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    read: true,
    isOnline: true,
    matchedOn: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() // 7 days ago
  }
];

// Mock messages
export const mockMessages = [
  {
    id: '401',
    conversationId: '201',
    senderId: '101',
    text: 'Hey there! How are you?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
  },
  {
    id: '402',
    conversationId: '201',
    senderId: 'currentUser',
    text: 'I\'m doing well, thanks! How about you?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.9).toISOString() // 1.9 hours ago
  },
  {
    id: '403',
    conversationId: '201',
    senderId: '101',
    text: 'Pretty good! Just finished a hike at Twin Peaks. The view was amazing!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.8).toISOString() // 1.8 hours ago
  },
  {
    id: '404',
    conversationId: '201',
    senderId: 'currentUser',
    text: 'That sounds awesome! I love hiking there too. We should go sometime!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.7).toISOString() // 1.7 hours ago
  },
  {
    id: '405',
    conversationId: '201',
    senderId: '101',
    text: 'Definitely! Are you free this weekend?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.6).toISOString() // 1.6 hours ago
  },
  {
    id: '406',
    conversationId: '201',
    senderId: 'currentUser',
    text: 'I should be free on Sunday afternoon. Does that work for you?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
  },
  {
    id: '407',
    conversationId: '201',
    senderId: '101',
    text: 'Sunday afternoon works perfectly! How about we meet at the trailhead around 2pm?',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 minutes ago
  },
  {
    id: '408',
    conversationId: '201',
    senderId: '101',
    text: 'Hey, want to grab coffee this weekend?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
  }
];