package com.sc2006.petcare.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.sc2006.petcare.DTO.ArticleDetailsDTO;
import com.sc2006.petcare.DTO.ArticleDetailsInputDTO;
import com.sc2006.petcare.DTO.ArticleDetailsUpdateDTO;
import com.sc2006.petcare.services.ArticleService;

@CrossOrigin(origins = "http://10.91.144.154:8080")
@RestController
@RequestMapping(value = "api/article")
public class ArticleController {
    @Autowired
    ArticleService articleService;

    @RequestMapping(value = "/getAllArticles", method = RequestMethod.GET, produces = "application/json")
    public List<ArticleDetailsDTO> getAllArticles() {
        return articleService.getAllArticles();
    }

    @RequestMapping(value = "/getArticleByArticleId/{articleId}", method = RequestMethod.GET, produces = "application/json")
    public ArticleDetailsDTO getArticleByArticleId(@PathVariable(value = "articleId") String articleId) {
        return articleService.getArticleByArticleId(articleId);
    }

    @RequestMapping(value = "/getArticleByPosterId/{posterId}", method = RequestMethod.GET, produces = "application/json")
    public List<ArticleDetailsDTO> getArticleByPosterId(@PathVariable(value = "posterId") String posterId) {
        return articleService.getArticleByPosterId(posterId);
    }

    @PostMapping(value = "/addArticle", consumes = { "multipart/form-data" })
    public String addArticle(@ModelAttribute ArticleDetailsInputDTO articleDetailsInputDTO) {
        return articleService.addArticle(articleDetailsInputDTO);
    }

    @PutMapping(value = "/editArticle/{articleId}", consumes = { "multipart/form-data" })
    public String editArticle(@PathVariable String articleId,
            @ModelAttribute ArticleDetailsUpdateDTO articleDetailsUpdateDTO) {
        return articleService.editArticle(articleId, articleDetailsUpdateDTO);
    }

    @RequestMapping(value = "/deleteArticle/{articleId}", method = RequestMethod.DELETE, produces = "application/json")
    public String deleteArticle(@PathVariable(value = "articleId") String articleId) {
        return articleService.deleteArticle(articleId);
    }
}
