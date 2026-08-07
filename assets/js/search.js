const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', (event) => {

    const value = event.target.value;

    const blogs = document.querySelectorAll('.container-blog .blog');

    blogs.forEach(blog => {

        const title = blog.querySelector('h1');

        if (
            FormatString(title.textContent)
            .includes(FormatString(value))
        ) {

            blog.style.display = 'flex';

        } else {

            blog.style.display = 'none';

        }

    });

});

function FormatString(value) {
    return value
        .toLowerCase()
        .trim();
}