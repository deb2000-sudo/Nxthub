import { User, Campaign, Influencer } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Marketing Manager',
    email: 'marketing@nxthub.com',
    role: 'manager',
    department: 'Marketing',
    avatar: 'https://picsum.photos/100/100?random=1'
  },
  {
    id: 'u2',
    name: 'Sales Manager',
    email: 'sales@nxthub.com',
    role: 'manager',
    department: 'Sales',
    avatar: 'https://picsum.photos/100/100?random=2'
  },
  {
    id: 'u3',
    name: 'Executive Vignesh',
    email: 'exec@nxthub.com',
    role: 'executive', // Executives have full access
    department: 'Headquarters',
    avatar: 'https://picsum.photos/100/100?random=3'
  }
];

export const MOCK_INFLUENCERS: Influencer[] = [
  { 
    id: 'i1', 
    name: 'Vignesh Sadula', 
    handle: '@whef;iuhf', 
    category: 'Fashion', 
    avatar: 'https://picsum.photos/200/200?random=4',
    email: 'vignesh.sadula@example.com',
    mobile: '+91 98765 43210',
    location: 'Telugu',
    lastPricePaid: 23456,
    lastPromoDate: '06 Nov 2025',
    platforms: {
      instagram: 'rishwireddyshetty',
      youtube: 'VigneshVlogs'
    },
    createdBy: 'marketing@nxthub.com'
  },
  { 
    id: 'i2', 
    name: 'Sarah Jones', 
    handle: '@sarahj_style', 
    category: 'Lifestyle', 
    avatar: 'https://picsum.photos/200/200?random=5',
    email: 'sarah.j@example.com',
    mobile: '+1 555 0199',
    location: 'English',
    lastPricePaid: 15000,
    lastPromoDate: '20 Oct 2025',
    platforms: {
      instagram: 'sarahj_style',
    },
    createdBy: 'sales@nxthub.com'
  },
  { 
    id: 'i3', 
    name: 'Mike Chen', 
    handle: '@mike_eats', 
    category: 'Food', 
    avatar: 'https://picsum.photos/200/200?random=6',
    email: 'mike.chen@foodie.com',
    mobile: '+1 555 0123',
    location: 'Chinese/English',
    lastPricePaid: 18500,
    lastPromoDate: '01 Nov 2025',
    platforms: {
      instagram: 'mike_eats_official',
      youtube: 'MikeChenEats'
    },
    createdBy: 'marketing@nxthub.com'
  },
  { 
    id: 'i4', 
    name: 'Alex Doe', 
    handle: '@alex_games', 
    category: 'Gaming', 
    avatar: 'https://picsum.photos/200/200?random=7',
    email: 'alex@gaming.net',
    mobile: '+44 7700 900077',
    location: 'English',
    lastPricePaid: 45000,
    lastPromoDate: '15 Sep 2025',
    platforms: {
      youtube: 'AlexPlays',
      instagram: 'alex_irl'
    },
    createdBy: 'exec@nxthub.com'
  },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Q3 Product Launch',
    influencerId: 'i1',
    department: 'Marketing',
    status: 'Pending',
    budget: 5000,
    startDate: '2023-10-01',
    endDate: '2023-10-31',
    deliverables: '1 Instagram Reel, 2 Stories',
    lastUpdated: '2023-09-25T10:00:00Z'
  },
  {
    id: 'c2',
    name: 'Holiday Sales Push',
    influencerId: 'i2',
    department: 'Sales',
    status: 'Approved',
    budget: 12000,
    startDate: '2023-11-15',
    endDate: '2023-12-25',
    deliverables: '3 YouTube Integrations',
    lastUpdated: '2023-10-15T14:30:00Z'
  },
  {
    id: 'c3',
    name: 'Employee Branding',
    influencerId: 'i3',
    department: 'HR',
    status: 'Rejected',
    budget: 2000,
    startDate: '2023-09-01',
    endDate: '2023-09-30',
    deliverables: '1 LinkedIn Post',
    lastUpdated: '2023-08-20T09:15:00Z'
  },
  {
    id: 'c4',
    name: 'Tech Review Series',
    influencerId: 'i4',
    department: 'Marketing',
    status: 'Approved',
    budget: 8000,
    startDate: '2023-10-05',
    endDate: '2023-11-05',
    deliverables: '1 Dedicated YouTube Video',
    lastUpdated: '2023-10-01T16:45:00Z'
  },
  {
    id: 'c5',
    name: 'Operations Audit Vlog',
    influencerId: 'i1',
    department: 'Operations',
    status: 'Pending',
    budget: 1500,
    startDate: '2023-10-10',
    endDate: '2023-10-20',
    deliverables: '1 Instagram Post',
    lastUpdated: '2023-10-05T11:20:00Z'
  }
];