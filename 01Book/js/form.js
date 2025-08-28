// 전역 변수
const API_BASE_URL = 'http://localhost:8080';
let editingBookId = null; // 현재 수정 중인 도서 ID

// DOM 요소 참조
const bookForm = document.getElementById('bookForm');
const bookTableBody = document.getElementById('bookTableBody');
const submitButton = bookForm.querySelector('button[type="submit"]');
let cancelButton = document.querySelector('.cancel-btn');
const loadingMessage = document.getElementById('loadingMessage');
let formError = document.getElementById('formError');

// 만약 formError가 없으면 동적으로 생성(안전장치)
if (!formError) {
    formError = document.createElement('div');
    formError.id = 'formError';
    formError.style.display = 'none';
    formError.style.marginTop = '8px';
    bookForm.insertAdjacentElement('afterend', formError);
}

// cancel 버튼이 없으면 동적으로 생성(안전장치)
if (!cancelButton) {
    cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'cancel-btn';
    cancelButton.textContent = '취소';
    submitButton.insertAdjacentElement('afterend', cancelButton);
    cancelButton.style.display = 'none';
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    clearMessages();
    loadBooks();
});

// 취소 버튼 처리
cancelButton.addEventListener('click', resetForm);

// 폼 제출 이벤트 핸들러
bookForm.addEventListener('submit', function(e) {
    e.preventDefault();
    clearMessages();

    // 폼 데이터 수집
    const formData = new FormData(bookForm);
    const bookData = {
        title: formData.get('title').trim(),
        author: formData.get('author').trim(),
        isbn: formData.get('isbn').trim(),
        price: formData.get('price') ? parseInt(formData.get('price')) : null,
        publishDate: formData.get('publishDate') || null,
        detail: {
            description: formData.get('description').trim(),
            language: formData.get('language').trim(),
            pageCount: formData.get('pageCount') ? parseInt(formData.get('pageCount')) : null,
            publisher: formData.get('publisher').trim(),
            coverImageUrl: formData.get('coverImageUrl').trim(),
            edition: formData.get('edition').trim()
        }
    };
    
    // 유효성 검사
    if (!validateBook(bookData)) {
        return;
    }

    // 등록 또는 수정 분기
    if (editingBookId) {
        updateBook(editingBookId, bookData);
    } else {
        createBook(bookData);
    }
});

// 도서 등록 함수
function createBook(bookData) {
    fetch(`${API_BASE_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
    .then(async (response) => {
        if (!response.ok) {
            // 서버가 JSON 에러 객체를 준다고 가정
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || '도서 등록에 실패했습니다.');
        }
        return response.json();
    })
    .then(() => {
        showSuccess("도서 등록 성공");
        resetForm();
        loadBooks();
    })
    .catch(err => {
        console.error(err);
        showError(err.message);
    });
}

// 도서 삭제 함수
function deleteBook(bookId) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    fetch(`${API_BASE_URL}/api/books/${bookId}`, { method: "DELETE" })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '도서 삭제에 실패했습니다.');
            }
            return response.text(); // 삭제는 빈 body 일 수 있음
        })
        .then(() => {
            showSuccess("삭제 완료");
            loadBooks();
        })
        .catch(err => {
            console.error(err);
            showError(err.message);
        });
}

// 도서 수정 준비 (폼에 데이터 채워넣기)
function editBook(bookId) {
    clearMessages();
    fetch(`${API_BASE_URL}/api/books/${bookId}`)
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '데이터 불러오기 실패');
            }
            return response.json();
        })
        .then(book => {
            editingBookId = book.id;

            bookForm.title.value = book.title || '';
            bookForm.author.value = book.author || '';
            bookForm.isbn.value = book.isbn || '';
            bookForm.price.value = book.price ?? '';
            bookForm.publishDate.value = book.publishDate || '';
            bookForm.language.value = book.detail?.language || '';
            bookForm.pageCount.value = book.detail?.pageCount ?? '';
            bookForm.publisher.value = book.detail?.publisher || '';
            bookForm.coverImageUrl.value = book.detail?.coverImageUrl || '';
            bookForm.edition.value = book.detail?.edition || '';
            bookForm.description.value = book.detail?.description || '';

            submitButton.textContent = "수정 완료";
            cancelButton.style.display = "inline-block";
            clearMessages();
        })
        .catch(err => {
            console.error(err);
            showError(err.message);
        });
}

// 도서 수정 처리
function updateBook(bookId, bookData) {
    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
    .then(async (response) => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || '도서 수정에 실패했습니다.');
        }
        return response.json();
    })
    .then(() => {
        showSuccess("수정 완료");
        resetForm();
        loadBooks();
    })
    .catch(err => {
        console.error(err);
        showError(err.message);
    });
}

// 도서 데이터 유효성 검사 (alert -> form 에러 표기로 변경)
function validateBook(book) {
    clearMessages();

    if (!book.title) {
        showError('제목을 입력해주세요.');
        bookForm.title.focus();
        return false;
    }
    if (!book.author) {
        showError('저자를 입력해주세요.');
        bookForm.author.focus();
        return false;
    }
    if (!book.isbn) {
        showError('ISBN을 입력해주세요.');
        bookForm.isbn.focus();
        return false;
    }
    const isbnPattern = /^[0-9X-]+$/;
    if (!isbnPattern.test(book.isbn)) {
        showError('올바른 ISBN 형식이 아닙니다. (숫자와 X, -만 허용)');
        bookForm.isbn.focus();
        return false;
    }
    if (book.price !== null && book.price < 0) {
        showError('가격은 0 이상이어야 합니다.');
        bookForm.price.focus();
        return false;
    }
    if (book.detail.pageCount !== null && book.detail.pageCount < 0) {
        showError('페이지 수는 0 이상이어야 합니다.');
        bookForm.pageCount.focus();
        return false;
    }
    if (book.detail.coverImageUrl && !isValidUrl(book.detail.coverImageUrl)) {
        showError('올바른 이미지 URL 형식이 아닙니다.');
        bookForm.coverImageUrl.focus();
        return false;
    }
    return true;
}

// URL 유효성 검사
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 도서 목록 로드 함수
function loadBooks() {    
    if (loadingMessage) loadingMessage.style.display = 'block';
    fetch(`${API_BASE_URL}/api/books`)
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '도서 목록을 불러오지 못했습니다.');
            }
            return response.json();
        })
        .then((books) => renderBookTable(books))
        .catch((error) => {
            console.error(error);
            showError(error.message);
            bookTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #dc3545;">
                        오류: 데이터를 불러올 수 없습니다.
                    </td>
                </tr>
            `;
        })
        .finally(() => {
            if (loadingMessage) loadingMessage.style.display = 'none';
        });
}

// 도서 테이블 렌더링
function renderBookTable(books) {
    bookTableBody.innerHTML = '';
    
    books.forEach(book => {
        const row = document.createElement('tr');
        
        const formattedPrice = (book.price || book.price === 0) ? `₩${Number(book.price).toLocaleString()}` : '-';
        const formattedDate = book.publishDate || '-';
        const publisher = book.detail ? (book.detail.publisher || '-') : '-';
        
        row.innerHTML = `
            <td>${escapeHtml(book.title)}</td>
            <td>${escapeHtml(book.author)}</td>
            <td>${escapeHtml(book.isbn)}</td>
            <td>${formattedPrice}</td>
            <td>${formattedDate}</td>
            <td>${escapeHtml(publisher)}</td>
            <td>
                <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                <button class="delete-btn" onclick="deleteBook(${book.id})">삭제</button>
            </td>
        `;
        
        bookTableBody.appendChild(row);
    });
}

// 간단한 XSS 대비(출력 시)
function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 폼 리셋
function resetForm() {
    bookForm.reset();
    editingBookId = null;
    submitButton.textContent = "도서 등록";
    cancelButton.style.display = 'none';
    clearMessages();
}

// 메시지 관련 유틸
function showSuccess(message) {
    formError.textContent = message;
    formError.style.display = 'block';
    formError.style.color = '#28a745';
}
function showError(message) {
    formError.textContent = message;
    formError.style.display = 'block';
    formError.style.color = '#dc3545';
}
function clearMessages() {
    formError.style.display = 'none';
    formError.textContent = '';
}
