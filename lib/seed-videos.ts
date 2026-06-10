import { collection, addDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

// Working thumbnail URLs from reliable sources
const musicThumbnails = [
  'https://picsum.photos/id/29/400/225',
  'https://picsum.photos/id/30/400/225',
  'https://picsum.photos/id/31/400/225',
  'https://picsum.photos/id/32/400/225',
  'https://picsum.photos/id/33/400/225',
  'https://picsum.photos/id/34/400/225',
  'https://picsum.photos/id/35/400/225',
  'https://picsum.photos/id/36/400/225',
  'https://picsum.photos/id/37/400/225',
  'https://picsum.photos/id/38/400/225',
  'https://picsum.photos/id/39/400/225',
  'https://picsum.photos/id/40/400/225',
];

const gamingThumbnails = [
  'https://picsum.photos/id/0/400/225',
  'https://picsum.photos/id/1/400/225',
  'https://picsum.photos/id/2/400/225',
  'https://picsum.photos/id/3/400/225',
  'https://picsum.photos/id/4/400/225',
  'https://picsum.photos/id/5/400/225',
  'https://picsum.photos/id/6/400/225',
  'https://picsum.photos/id/7/400/225',
  'https://picsum.photos/id/8/400/225',
  'https://picsum.photos/id/9/400/225',
  'https://picsum.photos/id/10/400/225',
  'https://picsum.photos/id/11/400/225',
];

const moviesThumbnails = [
  'https://picsum.photos/id/12/400/225',
  'https://picsum.photos/id/13/400/225',
  'https://picsum.photos/id/14/400/225',
  'https://picsum.photos/id/15/400/225',
  'https://picsum.photos/id/16/400/225',
  'https://picsum.photos/id/17/400/225',
  'https://picsum.photos/id/18/400/225',
  'https://picsum.photos/id/19/400/225',
  'https://picsum.photos/id/20/400/225',
  'https://picsum.photos/id/21/400/225',
  'https://picsum.photos/id/22/400/225',
  'https://picsum.photos/id/23/400/225',
];

const newsThumbnails = [
  'https://picsum.photos/id/24/400/225',
  'https://picsum.photos/id/25/400/225',
  'https://picsum.photos/id/26/400/225',
  'https://picsum.photos/id/27/400/225',
  'https://picsum.photos/id/28/400/225',
  'https://picsum.photos/id/29/400/225',
  'https://picsum.photos/id/30/400/225',
  'https://picsum.photos/id/31/400/225',
  'https://picsum.photos/id/32/400/225',
  'https://picsum.photos/id/33/400/225',
  'https://picsum.photos/id/34/400/225',
  'https://picsum.photos/id/35/400/225',
];

const sportsThumbnails = [
  'https://picsum.photos/id/36/400/225',
  'https://picsum.photos/id/37/400/225',
  'https://picsum.photos/id/38/400/225',
  'https://picsum.photos/id/39/400/225',
  'https://picsum.photos/id/40/400/225',
  'https://picsum.photos/id/41/400/225',
  'https://picsum.photos/id/42/400/225',
  'https://picsum.photos/id/43/400/225',
  'https://picsum.photos/id/44/400/225',
  'https://picsum.photos/id/45/400/225',
  'https://picsum.photos/id/46/400/225',
  'https://picsum.photos/id/47/400/225',
];

const technologyThumbnails = [
  'https://picsum.photos/id/48/400/225',
  'https://picsum.photos/id/49/400/225',
  'https://picsum.photos/id/50/400/225',
  'https://picsum.photos/id/51/400/225',
  'https://picsum.photos/id/52/400/225',
  'https://picsum.photos/id/53/400/225',
  'https://picsum.photos/id/54/400/225',
  'https://picsum.photos/id/55/400/225',
  'https://picsum.photos/id/56/400/225',
  'https://picsum.photos/id/57/400/225',
  'https://picsum.photos/id/58/400/225',
  'https://picsum.photos/id/59/400/225',
];

const comedyThumbnails = [
  'https://picsum.photos/id/60/400/225',
  'https://picsum.photos/id/61/400/225',
  'https://picsum.photos/id/62/400/225',
  'https://picsum.photos/id/63/400/225',
  'https://picsum.photos/id/64/400/225',
  'https://picsum.photos/id/65/400/225',
  'https://picsum.photos/id/66/400/225',
  'https://picsum.photos/id/67/400/225',
  'https://picsum.photos/id/68/400/225',
  'https://picsum.photos/id/69/400/225',
  'https://picsum.photos/id/70/400/225',
  'https://picsum.photos/id/71/400/225',
];

const educationThumbnails = [
  'https://picsum.photos/id/72/400/225',
  'https://picsum.photos/id/73/400/225',
  'https://picsum.photos/id/74/400/225',
  'https://picsum.photos/id/75/400/225',
  'https://picsum.photos/id/76/400/225',
  'https://picsum.photos/id/77/400/225',
  'https://picsum.photos/id/78/400/225',
  'https://picsum.photos/id/79/400/225',
  'https://picsum.photos/id/80/400/225',
  'https://picsum.photos/id/81/400/225',
  'https://picsum.photos/id/82/400/225',
  'https://picsum.photos/id/83/400/225',
];

const scienceThumbnails = [
  'https://picsum.photos/id/84/400/225',
  'https://picsum.photos/id/85/400/225',
  'https://picsum.photos/id/86/400/225',
  'https://picsum.photos/id/87/400/225',
  'https://picsum.photos/id/88/400/225',
  'https://picsum.photos/id/89/400/225',
  'https://picsum.photos/id/90/400/225',
  'https://picsum.photos/id/91/400/225',
  'https://picsum.photos/id/92/400/225',
  'https://picsum.photos/id/93/400/225',
  'https://picsum.photos/id/94/400/225',
  'https://picsum.photos/id/95/400/225',
];

const travelThumbnails = [
  'https://picsum.photos/id/96/400/225',
  'https://picsum.photos/id/97/400/225',
  'https://picsum.photos/id/98/400/225',
  'https://picsum.photos/id/99/400/225',
  'https://picsum.photos/id/100/400/225',
  'https://picsum.photos/id/101/400/225',
  'https://picsum.photos/id/102/400/225',
  'https://picsum.photos/id/103/400/225',
  'https://picsum.photos/id/104/400/225',
  'https://picsum.photos/id/105/400/225',
  'https://picsum.photos/id/106/400/225',
  'https://picsum.photos/id/107/400/225',
];

const foodThumbnails = [
  'https://picsum.photos/id/108/400/225',
  'https://picsum.photos/id/109/400/225',
  'https://picsum.photos/id/110/400/225',
  'https://picsum.photos/id/111/400/225',
  'https://picsum.photos/id/112/400/225',
  'https://picsum.photos/id/113/400/225',
  'https://picsum.photos/id/114/400/225',
  'https://picsum.photos/id/115/400/225',
  'https://picsum.photos/id/116/400/225',
  'https://picsum.photos/id/117/400/225',
  'https://picsum.photos/id/118/400/225',
  'https://picsum.photos/id/119/400/225',
];

const fashionThumbnails = [
  'https://picsum.photos/id/120/400/225',
  'https://picsum.photos/id/121/400/225',
  'https://picsum.photos/id/122/400/225',
  'https://picsum.photos/id/123/400/225',
  'https://picsum.photos/id/124/400/225',
  'https://picsum.photos/id/125/400/225',
  'https://picsum.photos/id/126/400/225',
  'https://picsum.photos/id/127/400/225',
  'https://picsum.photos/id/128/400/225',
  'https://picsum.photos/id/129/400/225',
  'https://picsum.photos/id/130/400/225',
  'https://picsum.photos/id/131/400/225',
];

const authors = [
  { id: 'auth-1', name: 'John Developer', seed: 'John' },
  { id: 'auth-2', name: 'Sarah Designer', seed: 'Sarah' },
  { id: 'auth-3', name: 'Mike Tech', seed: 'Mike' },
  { id: 'auth-4', name: 'Emma Creator', seed: 'Emma' },
  { id: 'auth-5', name: 'Alex Gamer', seed: 'Alex' },
  { id: 'auth-6', name: 'Lisa Music', seed: 'Lisa' },
];

const categoryData = {
  Music: [
    'How to Produce Electronic Music', 'Guitar Basics for Beginners', 'Mixing Audio Like a Pro',
    'Music Theory Fundamentals', 'Singing Tips from Professionals', 'Beat Making Tutorial',
    'Piano Lessons for Beginners', 'Music Production Setup Guide', 'Sound Design Mastery',
    'Live Performance Techniques', 'Music Composition Methods', 'Audio Engineering Basics'
  ],
  Gaming: [
    'Top 10 Gaming Tips and Tricks', 'Advanced Gaming Strategies', 'Gaming Hardware Guide',
    'Esports Training Methods', 'Gaming Setup Tour', 'Best Games of 2024',
    'Gaming Performance Optimization', 'Controller Setup Guide', 'Gaming Streaming Tips',
    'Battle Royale Tactics', 'RPG Game Reviews', 'Gaming Gear Comparison'
  ],
  Movies: [
    'Best Movies of All Time', 'Film Cinematography Breakdown', 'Movie Review: Latest Releases',
    'How Films Are Made', 'Oscar Winners Analysis', 'Classic Films Explained',
    'Movie Trailers Reaction', 'Superhero Films Ranking', 'Independent Films Guide',
    'Film Directors Spotlight', 'Movie Plots Explained', 'Animated Movies Review'
  ],
  News: [
    'Breaking News Report', 'Daily News Summary', 'International News Update',
    'Business News Analysis', 'Tech News of the Week', 'Science News Briefing',
    'Political News Coverage', 'Weather and Climate News', 'Entertainment News Round-up',
    'News Investigation Special', 'Fact Check Report', 'News Interview Special'
  ],
  Sports: [
    'Football Game Highlights', 'Basketball Training Guide', 'Tennis Techniques Explained',
    'Soccer Skills Tutorial', 'Sports Fitness Workout', 'Golf Swing Analysis',
    'Cricket Fundamentals', 'Baseball Tips and Tricks', 'Volleyball Tutorial',
    'Sports Nutrition Guide', 'Athletic Performance Tips', 'Marathon Training Plan'
  ],
  Technology: [
    'Getting Started with React', 'JavaScript ES6 Features Explained', 'Next.js Full Stack Development',
    'Web Design Tips for Beginners', 'Database Design Best Practices', 'Python Programming Tutorial',
    'Web Development Roadmap', 'API Design Best Practices', 'DevOps Essentials',
    'Machine Learning Basics', 'Cloud Computing Guide', 'Cybersecurity Fundamentals'
  ],
  Comedy: [
    'Comedy Stand-up Special', 'Funny Sketches Compilation', 'Hilarious Fails Collection',
    'Comedy Podcast Episode', 'Funny Moments Compilation', 'Comedy Drama Series',
    'Comedy Interview Series', 'Funny Vines Collection', 'Comedy Gaming Session',
    'Funny Pranks Video', 'Comedy Roast Session', 'Funny Reactions Compilation'
  ],
  Education: [
    'CSS Grid Layout Mastery', 'History Lesson: Ancient Rome', 'Math Fundamentals Explained',
    'Science Experiments at Home', 'English Literature Analysis', 'Geography World Tour',
    'Educational Documentary', 'Learning Tips and Tricks', 'Academic Skills Guide',
    'Study Techniques Explained', 'Subject Matter Expertise', 'Educational Interview'
  ],
  Science: [
    'Physics Explained Simply', 'Chemistry Lab Experiments', 'Biology Life Cycles',
    'Space Exploration Documentary', 'Quantum Mechanics Basics', 'Medical Science Update',
    'Environmental Science Issues', 'Astronomy Night Sky Guide', 'Fossil Discovery Report',
    'DNA Science Explained', 'Climate Change Analysis', 'Scientific Method Guide'
  ],
  Travel: [
    'Japan Travel Vlog', 'Europe Budget Travel Guide', 'Thailand Adventure Vlog',
    'USA Road Trip Vlog', 'Travel Packing Tips', 'Backpacking Adventure Stories',
    'Beach Destination Guide', 'Mountain Hiking Adventure', 'City Exploration Vlog',
    'Travel Photography Tips', 'Solo Travel Guide', 'Travel Food Reviews'
  ],
  Food: [
    'Easy Pasta Recipe Tutorial', 'Baking Bread from Scratch', 'Cooking Steak Perfectly',
    'Sushi Making Guide', 'Pizza Recipe Tutorial', 'Dessert Decoration Ideas',
    'Healthy Meal Prep', 'International Cuisine Cooking', 'Food Tasting Challenge',
    'Kitchen Hack Tips', 'Food Review Vlog', 'Cooking Technique Masterclass'
  ],
  Fashion: [
    'Fashion Haul Video', 'Styling Tips and Tricks', 'Fashion Week Highlights',
    'Outfit Ideas Collection', 'Fashion Design Tutorial', 'Accessory Styling Guide',
    'Fashion Trend Forecast', 'Wardrobe Organization Tips', 'Fashion DIY Projects',
    'Brand Review Video', 'Fashion Photography Tips', 'Fashion Lookbook Video'
  ]
};

const categoryThumbnails: { [key: string]: string[] } = {
  Music: musicThumbnails,
  Gaming: gamingThumbnails,
  Movies: moviesThumbnails,
  News: newsThumbnails,
  Sports: sportsThumbnails,
  Technology: technologyThumbnails,
  Comedy: comedyThumbnails,
  Education: educationThumbnails,
  Science: scienceThumbnails,
  Travel: travelThumbnails,
  Food: foodThumbnails,
  Fashion: fashionThumbnails,
};

function generateSampleVideos() {
  const videos: any[] = [];
  const categories = Object.keys(categoryData) as (keyof typeof categoryData)[];

  categories.forEach(category => {
    const titles = categoryData[category];
    const categoryThumbNails = categoryThumbnails[category] || musicThumbnails;
    
    titles.forEach((title, index) => {
      const author = authors[index % authors.length];
      const thumbnail = categoryThumbNails[index % categoryThumbNails.length];
      
      videos.push({
        title,
        description: `Join us in this exclusive ${category} video. ${title} is a comprehensive guide that covers all the essential aspects you need to know. Perfect for beginners and professionals alike.`,
        thumbnailUrl: thumbnail,
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        authorId: author.id,
        authorName: author.name,
        authorPhotoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.seed}`,
        views: Math.floor(Math.random() * 50000) + 500,
        likes: Math.floor(Math.random() * 5000) + 50,
        category,
      });
    });
  });

  return videos;
}

const sampleVideos = generateSampleVideos();

export async function clearAllVideos() {
  try {
    const videosCollection = collection(getFirebaseDb(), 'videos');
    const allVideos = await getDocs(videosCollection);
    
    for (const doc of allVideos.docs) {
      await deleteDoc(doc.ref);
    }
    
    console.log(`✅ Successfully deleted ${allVideos.docs.length} videos from Firestore!`);
  } catch (error) {
    console.error('❌ Error clearing videos:', error);
    throw error;
  }
}

export async function seedVideos() {
  try {
    const videosCollection = collection(getFirebaseDb(), 'videos');
    
    for (const video of sampleVideos) {
      await addDoc(videosCollection, {
        ...video,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    console.log(`✅ Successfully added ${sampleVideos.length} sample videos to Firestore!`);
  } catch (error) {
    console.error('❌ Error seeding videos:', error);
    throw error;
  }
}
