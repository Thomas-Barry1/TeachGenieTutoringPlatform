# Learning Style Storage Documentation

## Overview
The VARK Learning Style Quiz results are stored in the `user_info` table to enable personalized tutoring experiences and AI tutor recommendations.

## Database Schema

### Table: `user_info`
- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key to profiles table)
- **category**: TEXT[] (Array containing 'learning_style')
- **confidence_score**: DECIMAL(3,2) (0.0 to 1.0)
- **created_at**: TIMESTAMP WITH TIME ZONE
- **updated_at**: TIMESTAMP WITH TIME ZONE

## Storage Logic

### When Quiz is Completed:
1. **Delete Existing**: Remove any previous learning style entries for the user
2. **Store Primary Style**: Always stored with confidence_score = 1.0
3. **Store Secondary Style**: Only stored if score > 0, with confidence_score = 0.8

### Data Structure:
```sql
-- Primary Learning Style
{
  user_id: "user-uuid",
  category: ["learning_style"],
  confidence_score: 1.0
}

-- Secondary Learning Style (if applicable)
{
  user_id: "user-uuid", 
  category: ["learning_style"],
  confidence_score: 0.8
}
```

## VARK Types Stored:
- **V**: Visual
- **A**: Aural/Auditory  
- **R**: Read/Write
- **K**: Kinesthetic

## Usage Examples:

### Query User's Learning Styles:
```sql
SELECT * FROM user_info 
WHERE user_id = 'user-uuid' 
AND 'learning_style' = ANY(category)
ORDER BY confidence_score DESC;
```

### Get Primary Learning Style:
```sql
SELECT * FROM user_info 
WHERE user_id = 'user-uuid' 
AND 'learning_style' = ANY(category)
AND confidence_score = 1.0;
```

### Get Secondary Learning Style:
```sql
SELECT * FROM user_info 
WHERE user_id = 'user-uuid' 
AND 'learning_style' = ANY(category)
AND confidence_score = 0.8;
```

## Integration Points:
- **Tutor Matching**: Use learning styles to match students with compatible tutors
- **AI Tutor Personalization**: Adapt teaching methods based on learning preferences
- **Study Recommendations**: Suggest study techniques aligned with learning style
- **Session Planning**: Help tutors plan sessions that match student preferences

## Notes:
- Results are overwritten each time the quiz is retaken
- Only the top 2 learning styles are stored (primary + secondary if applicable)
- Confidence scores help prioritize which learning style to emphasize
- Storage happens asynchronously - quiz results are shown even if database save fails

