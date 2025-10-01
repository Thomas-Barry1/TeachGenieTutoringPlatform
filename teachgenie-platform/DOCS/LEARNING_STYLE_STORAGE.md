# Learning Style Storage Documentation

## Overview
The VARK Learning Style Quiz results are stored in the `user_info` table to enable personalized tutoring experiences and AI tutor recommendations.

## Database Schema

### Table: `user_info`
- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key to profiles table)
- **category**: TEXT[] (Array containing 'learning_style')
- **confidence_score**: DECIMAL(3,2) (0.0 to 1.0)
- **data**: JSONB (Stores learning style details and other user information)
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
  confidence_score: 1.0,
  data: {
    "vark_type": "V",
    "vark_name": "Visual",
    "all_scores": {"V": 8, "A": 3, "R": 2, "K": 3}
  }
}

-- Secondary Learning Style (if applicable)
{
  user_id: "user-uuid", 
  category: ["learning_style"],
  confidence_score: 0.8,
  data: {
    "vark_type": "A",
    "vark_name": "Aural/Auditory",
    "all_scores": {"V": 8, "A": 3, "R": 2, "K": 3}
  }
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
SELECT data->>'vark_type' as learning_style, 
       data->>'vark_name' as style_name,
       data->'all_scores' as all_scores
FROM user_info 
WHERE user_id = 'user-uuid' 
AND 'learning_style' = ANY(category)
AND confidence_score = 1.0;
```

### Get Secondary Learning Style:
```sql
SELECT data->>'vark_type' as learning_style, 
       data->>'vark_name' as style_name
FROM user_info 
WHERE user_id = 'user-uuid' 
AND 'learning_style' = ANY(category)
AND confidence_score = 0.8;
```

### Get All Learning Style Data:
```sql
SELECT 
  data->>'vark_type' as vark_type,
  data->>'vark_name' as vark_name,
  data->'all_scores' as all_scores,
  confidence_score,
  created_at,
  CASE WHEN confidence_score = 1.0 THEN true ELSE false END as is_primary
FROM user_info 
WHERE user_id = 'user-uuid' 
AND 'learning_style' = ANY(category)
ORDER BY confidence_score DESC;
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

