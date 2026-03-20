# FourSquare
# Dynamic Group Planner

## Timeline
March 9 – April 4

## Overview
A web-based group planning platform that integrates location discovery, real-time coordination, and scheduling. The system uses user history and group behavior to generate recommendations, while leveraging mapping and calendar services for end-to-end planning.

## Tech Stack
- Frontend: React.js / Next.js  
- Backend: FastAPI or Express.js  
- Database: Firebase or Supabase  
- APIs: Google Places API, Google Maps API, Google Directions API  

## Core Features
- Recommendation engine based on user history and group patterns  
- Group creation, voting, and real-time coordination  
- Live map visualization with geolocation and routing  
- Calendar integration via `.ics` file generation  
- Secure authentication with role-based access control  

## System Components

### Database
- Schema for users, places, visits, and votes  
- Stores geolocation and visit frequency  
- Tracks prior recommendations to reduce repetition  

### Backend
- REST API for authentication, group management, and voting  
- Recommendation algorithm for discovery  
- Real-time synchronization of user activity and dashboards  

### Frontend
- Responsive dashboards for group tracking and activity  
- Real-time updates for voting and recommendations  
- Interactive UI for maps and place tracking  

### Integrations
- Google Places API for location discovery  
- Google Maps & Directions API for navigation and routing  
- `.ics` generation for calendar syncing  

### Security
- Role-based authentication (admin vs. user)  
- Enforced HTTPS and secure data handling  
- User privacy controls  

## Goals
- Centralize group planning and discovery  
- Enable real-time collaboration  
- Build a scalable, data-driven recommendation system  
