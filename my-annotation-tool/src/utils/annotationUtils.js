export const saveAnnotations = (annotations) => {
    localStorage.setItem('annotations', JSON.stringify(annotations));
  };
  
  export const loadAnnotations = () => {
    const data = localStorage.getItem('annotations');
    return data ? JSON.parse(data) : [];
  };
  