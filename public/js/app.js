class Alert
{
	constructor(title, textAction, textApply, applyCallback, negative)
	{
		this.title = title;
		this.textAction = textAction;
		this.textApply = textApply;
		this.applyCallback = applyCallback;
		this.negative = negative;
		this.createModal();
	}

	createModal()
	{
		$("body").append("<div class=\"greyFilter absolute\" style=\"top: 0; right: 0; left: 0; height: 100vh; overflow: hidden; z-index: 98; background-color: rgba(0, 0, 0, 0.75);\"></div>");
		this.container = $("body .greyFilter").append("<form class=\"absolute\" style=\"height: auto; min-width: 300px; max-width: 400px; width: 100%; top: 25%; left: 50%; transform: translate(-50%, -50%); background-color: #FFFFFF; padding: 10px; border-radius: 4px;\"></form>");
		$("body .greyFilter form").append("<div class\"textcenter\" style=\"font-size: 2rem;\">"+this.title+"</div>");
		$("body .greyFilter form").append("<span class\"textcenter\">"+this.textAction+"</span>");
		$("body .greyFilter form").append("<div class=\"flex row nowrap\" style=\"margin-top: 40px; justify-content: flex-end;\"></div>");
		$("body .greyFilter form div.flex").append("<button class=\"tertiary pointer\">Annuler</button><button class=\"primary brandBackgroundColorPrimary pointer\">"+this.textApply+"</button>");

		var self = this;
		$("body .greyFilter form div.flex button.tertiary").click(function(e)
		{
			e.preventDefault();
			e.stopPropagation();
			self.container.remove();
		});
		$("body .greyFilter form div.flex button.primary").click(function(e)
		{
			e.preventDefault();
			e.stopPropagation();
			self.applyCallback();
			self.container.remove();
		});
	}
}

class EditPopup
{
	constructor(dataUrl)
	{
		this.dataUrl = dataUrl;
		this.createModal();
	}

	createModal()
	{

	}
}

class TableApp
{
	constructor(container, submitUrl, specialEdit)
	{
		this.container = container;
		this.submitUrl = submitUrl;
		this.specialEdit = specialEdit;
		this.getData();
	}

	getData()
	{
		let self = this;
		$.ajax(
			{
				url: this.submitUrl,
				context: document.body,
				type: "GET",
				dataType: "json"
			}).done(function(data)
			{
				self.rawData = data;
				self.header = self.rawData.header;
				self.data = self.sanitize(self.rawData.data);
				self.emptyContainer = $(self.container.clone());
				self.buildTable();
				self.setSortable();
			});
	}

	sanitize(data)
	{
		let sanitizedData = data;
		return (sanitizedData);
	}

	addControls()
	{
		let self = this;

		for(let i = 0; i < this.header.length - 1; i++)
		{
			this.container.find("thead tr.controls").append("<td></td>");
		}
		this.container.find("thead tr.controls").append("<td><div class=\"relative\"><i class=\"mdi mdi-close absolute pointer\"></i></div><div class=\"relative\"><i class=\"mdi mdi-check absolute pointer\"></i></div></td>");

		this.container.find("thead tr.controls td div i.mdi-close").click(function()
		{
			let container = self.destroyTable();

			new TableApp(container, self.submitUrl, self.specialEdit);
		});

		this.container.find("thead tr.controls td div i.mdi-check").click(function()
		{
			self.applyTable();
		});
	}

	removeControls()
	{
		this.container.find("thead tr.controls td").remove();
	}

	applyTable()
	{
		let self = this;
		$.ajax(
		{
			url: self.submitUrl,
			context: document.body,
			type: "PUT",
			contentType: "application/json",
			data: JSON.stringify({"header": self.header, "data": self.data}),
			dataType: "json"
		}).always(() =>
		{
			let container = self.destroyTable();
			new TableApp(container, self.submitUrl, self.specialEdit);
		});
	}

	destroyTable()
	{
		this.container.replaceWith(this.emptyContainer);
		return (this.emptyContainer);
	}

	setRemovableElement(element)
	{
		let self = this;
		element.hover(function()
		{
			$(this).find("td:last-of-type").addClass("relative")
			$(this).find("td:last-of-type").append("<i class=\"mdi mdi-delete absolute pointer\"></i>");
			$(this).find("i.mdi-delete").click(function(e)
			{
				e.preventDefault();
				e.stopPropagation();
				let element = $(this).parents("tr");
				new Alert("Supprimer la ligne", "Souhaitez-vous supprimer cette ligne ?", "supprimer",
				function()
				{
					element.remove();
					self.testForUpdates();
				}, true);
			});
		}, function(e)
		{
			$(this).find(".mdi-delete").remove();
		});
	}

	setEditableElement(element)
	{
		if (!this.specialEdit) return;
		element.hover(function()
		{
			$(this).find("td:last-of-type").addClass("relative");
			$(this).find("td:last-of-type").append("<i class=\"mdi mdi-pencil absolute pointer\"></i>");
			$(this).find("i.mdi-pencil").click(function(e)
			{
				e.preventDefault();
				e.stopPropagation();
				let element = $(this).parents("tr");
				new EditPopup();
			});
		}, function(e)
		{
			$(this).find(".mdi-pencil").remove();
		});
	}

	applyEditContentCallback(element)
	{
		var self = this;
		return (function()
		{
			element.text(element.find("input").val());
			element.find("input").remove();
			element.css({"font-size": "1rem"});
			element.removeClass("editing");
			self.setEditableContent(element);
			self.testForUpdates();
		});
	}

	applyEditContent(element, self)
	{
		element.text(element.find("input").val());
		element.find("input").remove();
		element.css({"font-size": "1rem"});
		element.removeClass("editing");
		self.setEditableContent(element);
		self.testForUpdates();
	}

	setEditableContent(element)
	{
		let self = this;
		element.click(function()
		{
			if (element.hasClass("editing")) return;
			$(this).addClass("editing");
			(!isNaN(parseFloat($(this).text())) && isFinite($(this).text())) ? $(this).append("<input type=\"number\" value=\""+$(this).text()+"\"/>") : $(this).append("<input type=\"text\" value=\""+$(this).text()+"\"/>");
			$(this).find("input").focus();
			$(this).css({"font-size": "0px"});
			$(this).focusout(self.applyEditContentCallback(element));
			$(this).find("input").keypress(function(event)
			{
				var keycode = (event.keyCode ? event.keyCode : event.which);
				if(keycode === "13")
				{
					self.applyEditContent(element, self);
				}
			});
		});
	}

	buildTable()
	{
		var self = this;
		this.header.forEach(function(index)
		{
			self.container.find("thead tr.header").append("<th scope=\"col\">"+index+"</th>");
		});

		let i = 0;
		this.data.forEach(function(index)
		{
			if (typeof index == "object")
			{
				self.container.find("tbody").append("<tr class=\"working\"></tr>");
				index.forEach(function(subIndex)
				{
					//TODO: cast booleans to checkboxes
					if (subIndex === true || subIndex === false)
						self.container.find("tbody tr.working").append("<td data-header=\""+self.header[i]+"\">"+subIndex+"</td>");
					else if (subIndex === null)
						self.container.find("tbody tr.working").append("<td data-header=\""+self.header[i]+"\"></td>");
					else
						self.container.find("tbody tr.working").append("<td data-header=\""+self.header[i]+"\">"+subIndex+"</td>");
					i++;
				});
				self.container.find("tbody tr.working td:not(.editing)").each(function()
				{
					self.setEditableContent($(this));
				});
				self.setRemovableElement(self.container.find("tbody tr.working"));
				self.setEditableElement(self.container.find("tbody tr.working"));
				self.container.find("tbody tr.working").removeClass("working");
			}
			else
			{
				//TODO: cast booleans to checkboxes
				if (index === true || index === false)
					self.container.find("tbody").append("<tr><td data-header=\""+self.header[i]+"\">"+index+"</td></tr>");
				else if (index == null)
					self.container.find("tbody").append("<tr><td data-header=\""+self.header[i]+"\"></td></tr>");
				else
					self.container.find("tbody").append("<tr><td data-header=\""+self.header[i]+"\">"+index+"</td></tr>");
				i++;
			}
		});
		this.addCreateRow();
	}

	addCreateRow()
	{
		let self = this;
		this.container.find("tbody").append("<tr class=\"addRow pointer\"></tr>");

		for(let i = 0; i < this.header.length; i++)
		{
			this.container.find(".addRow").append("<td class=\"textcenter\">+</td>");
		}

		this.container.find(".addRow").click(function()
		{
			self.container.find("tbody").append("<tr class=\"createdRow\"></tr>");
			for(let i = 0; i < self.header.length; i++)
			{
				self.container.find(".createdRow").append("<td data-header=\""+self.header[i]+"\"></td>");
			}
			$("tr.createdRow").insertBefore("tr.addRow");
			self.container.find("tbody tr.createdRow td:not(.editing)").each(function()
			{
				self.setEditableContent($(this));
			});
			self.setRemovableElement(self.container.find("tbody tr.createdRow"));
			self.setEditableElement(self.container.find("tbody tr.createdRow"));
			$("tr.createdRow").removeClass("createdRow");
			self.testForUpdates();
		});
	}

	computeTable()
	{
		let computedArray = new Array();
		let self = this;
		this.container.find("tbody tr").each(function()
		{
			computedArray.push(self.rowToArray($(this)));
		});
		return(computedArray);
	}

	rowToArray(target)
	{
		let elementArray = new Array();
		target.children().each(function()
		{
			if ($(this).text() === "true")
				elementArray.push(true);
			else if ($(this).text() === "false")
				elementArray.push(false);
			else if ($(this).text() === "")
				elementArray.push(null);
			else
				elementArray.push((!isNaN($(this).text())) ? Number($(this).text()) : $(this).text());
		});
		return (elementArray);
	}

	isEqual(value, other)
	{
		var type = Object.prototype.toString.call(value);
		
		if (type !== Object.prototype.toString.call(other))
		{
			return false;
		}
		if (["[object Array]", "[object Object]"].indexOf(type) < 0)
		{
			return false;
		}
		
		var valueLen = (type === "[object Array]") ? value.length : Object.keys(value).length;
		var otherLen = (type === "[object Array]") ? other.length : Object.keys(other).length;
		
		if (valueLen !== otherLen)
		{
			return false;
		}
		
		var self = this;
		var compare = function (item1, item2)
		{
			var itemType = Object.prototype.toString.call(item1);
			
			if (["[object Array]", "[object Object]"].indexOf(itemType) >= 0)
			{
				if (!self.isEqual(item1, item2))
				{
					return false;
				}
			}
			else
			{
				if (itemType !== Object.prototype.toString.call(item2))
				{
					return false;
				}
				if (item1 !== item2)
				{
					return false;
				}
			}
		};

		if (type === "[object Array]")
		{
			for (var i = 0; i < valueLen; i++)
			{
				if (compare(value[i], other[i]) === false)
				{
					return false;
				}
			}
		}
		else
		{
			for (var key in value)
			{
				if (value.hasOwnProperty(key))
				{
					if (compare(value[key], other[key]) === false)
					{
						return false;
					}
				}
			}
		}
		return true;
	}

	testForUpdates()
	{
		let addRow = this.container.find(".addRow").clone(true, false);
		this.container.find(".addRow").remove();
		let data = this.computeTable();
		this.data = data;
		if(!this.isEqual(this.data, this.rawData.data))
		{
			this.removeControls();
			this.addControls();
		}
		else
		{
			this.removeControls();
		}
		this.container.append(addRow);
	}

	setSortable()
	{
		this.backupSize();
		let self = this;
		//TODO: Remove ternary operator multiline (set function anywhere else && call it in sortable())
		this.container.find("tbody").sortable(
		{
			axis: "y",
			tolerance: "intersect",
			placeholder: "sortable-placeholder",
			update(event, ui)
			{
				self.testForUpdates();
			},
			sort(event, ui) { return; },
		});
		this.container.find("tbody" ).disableSelection();
	}

	backupSize()
	{
		let headerSizes = [];
		this.container.find("tr.header *").each(function(){
			headerSizes.push($(this).width());
		});

		let i = 0;
		this.container.find("tbody td").each(function()
		{
			$(this).width(headerSizes[i]);
			i = (i + 1 > headerSizes.length - 1) ? 0 : i + 1;
		});
	}
}

$(document).ready(function()
{
});
