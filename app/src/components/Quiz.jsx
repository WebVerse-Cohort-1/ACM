import React, { useState, useEffect } from 'react';

import { createClient } from '@sanity/client';
const client = createClient({ projectId: 'gx7rj7pk', dataset: 'production', useCdn: true, apiVersion: '2023-05-03' });

export function Quiz({ initialQuizId }) {
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizId || '');
  const [quizData, setQuizData] = useState(null);
  
  const [participantId, setParticipantId] = useState('');
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    client.fetch(`*[_type == "quiz"]{ _id, title, eventSlug }`)
      .then(data => setAvailableQuizzes(data))
      .catch(console.error);
  }, [initialQuizId]);

  useEffect(() => {
    if (!selectedQuizId) return;
    
    client.fetch(`*[_type == "quiz" && _id == $id][0]`, { id: selectedQuizId })
      .then(data => setQuizData(data))
      .catch(console.error);
  }, [selectedQuizId]);

  const handleOptionSelect = (questionKey, optionIndex) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionKey);
      if (existing) {
        return prev.map(a => a.questionId === questionKey ? { ...a, selectedOptionIndex: optionIndex } : a);
      }
      return [...prev, { questionId: questionKey, selectedOptionIndex: optionIndex }];
    });
  };

  const handleTextAnswer = (questionKey, text) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionKey);
      if (existing) {
        return prev.map(a => a.questionId === questionKey ? { ...a, textAnswer: text } : a);
      }
      return [...prev, { questionId: questionKey, textAnswer: text }];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!participantId) {
      alert('Please enter your participant ID or Email.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quizData._id,
          quizTitle: quizData.title,
          eventSlug: quizData.eventSlug,
          participantId,
          answers
        })
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        alert('Error submitting quiz.');
      }
    } catch (error) {
      console.error(error);
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return <div className="text-green-500 font-bold max-w-2xl mx-auto p-6 text-center">Quiz Submitted Successfully!</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      {!initialQuizId && !quizData && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Select an Event / Quiz</h2>
          <select 
            className="w-full p-2 border rounded"
            value={selectedQuizId}
            onChange={e => setSelectedQuizId(e.target.value)}
          >
            <option value="">-- Choose an Event --</option>
            {availableQuizzes.map(quiz => (
              <option key={quiz._id} value={quiz._id}>
                {quiz.title} ({quiz.eventSlug})
              </option>
            ))}
          </select>
        </div>
      )}

      {quizData && (
        <>
          <h1 className="text-2xl font-bold mb-4">{quizData.title} <span className="text-sm font-normal text-gray-500">({quizData.eventSlug})</span></h1>
          
          <div className="mb-6">
            <label className="block mb-2 font-semibold">Your Participant ID / Email:</label>
            <input 
              type="text" 
              value={participantId} 
              onChange={(e) => setParticipantId(e.target.value)} 
              className="border p-2 w-full rounded"
              placeholder="student@example.com"
            />
          </div>

          {quizData.questions?.map((q, idx) => (
            <div key={q._key} className="mb-6 p-4 border rounded">
              <p className="font-semibold mb-2">{idx + 1}. {q.text}</p>
              
              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <label key={optIdx} className="block">
                      <input 
                        type="radio" 
                        name={`question_${q._key}`} 
                        value={optIdx}
                        onChange={() => handleOptionSelect(q._key, optIdx)}
                        className="mr-2"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea 
                  className="w-full border p-2 rounded" 
                  rows="3"
                  onChange={(e) => handleTextAnswer(q._key, e.target.value)}
                  placeholder="Type your answer here..."
                />
              )}
            </div>
          ))}
          
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </>
      )}
    </div>
  );
}
