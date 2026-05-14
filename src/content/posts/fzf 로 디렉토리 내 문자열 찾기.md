---
title: "fzf 로 디렉토리 내 문자열 찾기"
description: "현재 디렉토리 내에서 원하는 문자열을 포함하는 곳을 모두 찾고 싶을 때가 있다."
date: 2025-06-04
tags: [linux]
lang: ko
draft: false
---

# Why?

왜 배움?

---

---

현재 디렉토리 내에서 원하는 문자열을 포함하는 곳을 모두 찾고 싶을 때가 있다.

이는 IDE 들에서는 제공하고 있는데, 대표적인 예시로 intellij 의 find in files 가 있다.

이를 shell 에서 할 수 없을까 고민하였고, 아래와 같이 정리해보았다.

![](/images/notion/b15650c323423b2f.png)

# What?

뭘 배움?

---

---

## find 로 찾기

```bash
find . -type f -exec grep --color=always ${원하는 문자열} {} ';'
```

- `find` : 파일 및 디렉토리를 검색 명령어
- `-type f` : 파일만 조회 ([man page](https://man7.org/linux/man-pages/man1/find.1.html#:~:text=versions%20of%20findutils.-,%2Dtype,-Supported.%20%20POSIX%20specifies)) ([블로그](https://recipes4dev.tistory.com/156#google_vignette:~:text=%22%2Dtype%22%20%ED%91%9C%ED%98%84%EC%8B%9D%EC%9D%84%20%EC%82%AC%EC%9A%A9%ED%95%98%EC%97%AC,s%20%3A%20socket))
- `-exec ${실행하고자하는 명령어} {} \;` : 검색된 파일에 대해 지정된 명령 실행
- `grep` : 지정한 문자열이나 정규표현식을 포함한 행을 출력
- `--color=always` : 출력결과물을 예쁘게 색을 넣어준다. ([man page](https://man7.org/linux/man-pages/man1/grep.1.html#:~:text=non%2Dmatching%20lines.-,%2D%2Dcolor,-%5B%3DWHEN))

> 예시

## fzf 활용하여 미리 보기

[https://www.reddit.com/r/commandline/comments/vjmkqw/help_with_having_pipe_wait_for_fzf_output/](https://www.reddit.com/r/commandline/comments/vjmkqw/help_with_having_pipe_wait_for_fzf_output/[^2]) 를  통해 [https://github.com/gennaro-tedesco/dotfiles/blob/b9c22446b63346052817c50b5865ad1d37f0e352/zsh/zshfun#L44-L71](https://github.com/gennaro-tedesco/dotfiles/blob/b9c22446b63346052817c50b5865ad1d37f0e352/zsh/zshfun#L44-L71[^3]) 를 참고하였다.

아직도 script pipeline 은 참 어렵다 ㅠㅠ

```bash
search() {
	[[ $# -eq 0 ]] && { echo "provide regex argument"; return }
	local matching_files
	case $1 in
		-h)
			shift
			regex=$1
			matching_files=$(rg -l --hidden ${regex} | fzf --exit-0 --preview="rg --color=always -n '${regex}' {} ")
			;;
		*)
			regex=$1
			matching_files=$(rg -l -- ${regex} | fzf --exit-0 --preview="rg --color=always -n -- '${regex}' {} ")
			;;
	esac
	[[ -n "$matching_files" ]] && ${EDITOR} "${matching_files}" -c/${regex}
}
```

![](/images/notion/9b0f20f5e8e71445.gif)

[^1]: https://www.youtube.com/shorts/shrd1M17Sbo <https://www.youtube.com/shorts/shrd1M17Sbo>
[^2]: https://www.reddit.com/r/commandline/comments/vjmkqw/help_with_having_pipe_wait_for_fzf_output/ <https://www.reddit.com/r/commandline/comments/vjmkqw/help_with_having_pipe_wait_for_fzf_output/>
[^3]: https://github.com/gennaro-tedesco/dotfiles/blob/b9c22446b63346052817c50b5865ad1d37f0e352/zsh/zshfun#L44-L71 <https://github.com/gennaro-tedesco/dotfiles/blob/b9c22446b63346052817c50b5865ad1d37f0e352/zsh/zshfun#L44-L71>
