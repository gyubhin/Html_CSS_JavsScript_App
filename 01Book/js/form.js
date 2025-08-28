
// 전역 변수
const API_BASE_URL = 'http://localhost:8080';
let editingBookId = null; // 현재 수정 중인 도서 ID

// DOM 요소 참조
const bookForm = document.getElementById('bookForm');
const bookTableBody = document.getElementById('bookTableBody');
const submitButton = bookForm.querySelector('button[type="submit"]');
const cancelButton = bookForm.querySelector('.cancel-btn');
const loadingMessage = document.getElementById('loadingMessage');
const formError = document.getElementById('formError');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지 로드 완료');
    loadBooks();
});

// 폼 제출 이벤트 핸들러
bookForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
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
    

});

// 도서 데이터 유효성 검사
function validateBook(book) {
    // 필수 필드 검사
    if (!book.title) {
        alert('제목을 입력해주세요.');
        return false;
    }
    
    if (!book.author) {
        alert('저자를 입력해주세요.');
        return false;
    }
    
    if (!book.isbn) {
        alert('ISBN을 입력해주세요.');
        return false;
    }
    
    // ISBN 형식 검사 (기본적인 영숫자 조합)
    const isbnPattern = /^[0-9X-]+$/;
    if (!isbnPattern.test(book.isbn)) {
        alert('올바른 ISBN 형식이 아닙니다. (숫자와 X, -만 허용)');
        return false;
    }
    
    // 가격 유효성 검사
    if (book.price !== null && book.price < 0) {
        alert('가격은 0 이상이어야 합니다.');
        return false;
    }
    
    // 페이지 수 유효성 검사
    if (book.detail.pageCount !== null && book.detail.pageCount < 0) {
        alert('페이지 수는 0 이상이어야 합니다.');
        return false;
    }
    
    // URL 형식 검사 (입력된 경우에만)
    if (book.detail.coverImageUrl && !isValidUrl(book.detail.coverImageUrl)) {
        alert('올바른 이미지 URL 형식이 아닙니다.');
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
    fetch(`${API_BASE_URL}/api/books`)
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                throw new Error(`${errorData.message}`);
            }
            return response.json();
        })
        .then((students) => renderStudentTable(students))
        .catch((error) => {
            console.log(error);
            //alert(">>> 도서 목록을 불러오는데 실패했습니다!.");
            alert(error.message);
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #dc3545;">
                        오류: 데이터를 불러올 수 없습니다.
                    </td>
                </tr>
            `;
        });    
}

// 도서 테이블 렌더링
function renderBookTable(books) {
    bookTableBody.innerHTML = '';
    
    books.forEach(book => {
        const row = document.createElement('tr');
        
        const formattedPrice = book.price ? `₩${book.price.toLocaleString()}` : '-';
        const formattedDate = book.publishDate || '-';
        const publisher = book.detail ? book.detail.publisher || '-' : '-';
        
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${formattedPrice}</td>
            <td>${formattedDate}</td>
            <td>${publisher}</td>
            <td>
                <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                <button class="delete-btn" onclick="deleteBook(${book.id})">삭제</button>
            </td>
        `;
        
        bookTableBody.appendChild(row);
    });
}
